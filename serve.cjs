const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { promisify } = require('node:util');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
for (const line of (fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}
const port = Number(process.env.PORT) || 4173;
const databasePath = process.env.DATABASE_PATH || path.join(root, 'data', 'olivine.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath, { timeout: 5000 });
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    media_path TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    media_path TEXT NOT NULL DEFAULT '',
    media_type TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
// Upgrade databases created before the admin/content features.
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'"); } catch (error) { if (!/duplicate column/i.test(error.message)) throw error; }
const mediaRoot = path.join(root, 'data', 'media');
fs.mkdirSync(mediaRoot, { recursive: true });

const scrypt = promisify(crypto.scrypt);
const sessionAge = 7 * 24 * 60 * 60 * 1000;
const cookieName = 'olivine_session';
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/premium.css', ['premium.css', 'text/css; charset=utf-8']],
  ['/script.js', ['script.js', 'text/javascript; charset=utf-8']],
  ['/locales.js', ['locales.js', 'text/javascript; charset=utf-8']],
  ['/posts', ['posts.html', 'text/html; charset=utf-8']],
  ['/posts.html', ['posts.html', 'text/html; charset=utf-8']],
  ['/posts.css', ['posts.css', 'text/css; charset=utf-8']],
  ['/posts.js', ['posts.js', 'text/javascript; charset=utf-8']],
  ['/olivine-logo-display.jpg', ['olivine-logo-display.jpg', 'image/jpeg']],
  ['/olivine-logo-original.jpg', ['olivine-logo-original.jpg', 'image/jpeg']],
  ['/admin', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.html', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.css', ['admin.css', 'text/css; charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript; charset=utf-8']],
]);
const attempts = new Map();
const rateLimitWindow = 15 * 60 * 1000;
const rateLimitCount = 10;
const dummySalt = crypto.randomBytes(16).toString('base64url');
const dummyHash = crypto.scryptSync('timing-only-password', dummySalt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('base64url');

function hashSession(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  response.setHeader('Cache-Control', 'no-store');
}

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
  response.end(JSON.stringify(value));
}

function cookieHeader(token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === '1' ? '; Secure' : '';
  return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function readCookie(request, name) {
  const raw = request.headers.cookie || '';
  for (const part of raw.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return '';
}

function allowSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function rateLimit(request) {
  const now = Date.now();
  const key = request.socket.remoteAddress || 'unknown';
  const recent = (attempts.get(key) || []).filter((time) => now - time < rateLimitWindow);
  if (recent.length >= rateLimitCount) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

function readJson(request, maxBytes = 8192) {
  return new Promise((resolve, reject) => {
    const contentType = (request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      request.resume();
      return reject(Object.assign(new Error('Unsupported content type'), { status: 415 }));
    }
    const announcedLength = Number(request.headers['content-length'] || 0);
    if (announcedLength > maxBytes) {
      request.resume();
      return reject(Object.assign(new Error('Request too large'), { status: 413 }));
    }
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (tooLarge) {
        reject(Object.assign(new Error('Request too large'), { status: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + sessionAge;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashSession(token), userId, expiresAt);
  return token;
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role || 'student' };
}

function getSessionUser(request) {
  const token = readCookie(request, cookieName);
  if (!token || token.length > 100) return null;
  const row = db.prepare(`SELECT users.id, users.name, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`).get(hashSession(token), Date.now());
  return row || null;
}

function requireAdmin(request, response) {
  const user = getSessionUser(request);
  if (!user) { sendJson(response, 401, { error: 'unauthorized' }); return null; }
  if (user.role !== 'admin') { sendJson(response, 403, { error: 'forbidden' }); return null; }
  return user;
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function contentRow(row) {
  return row;
}

function recordNotification(subject, body) {
  const result = db.prepare('INSERT INTO admin_notifications (subject, body) VALUES (?, ?)').run(subject, body);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'olivineschooldz@gmail.com';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    // The notification remains visible in the dashboard even when SMTP is unavailable.
    sendSmtpMail(to, subject, body).then(() => db.prepare("UPDATE admin_notifications SET status = 'sent' WHERE id = ?").run(Number(result.lastInsertRowid)))
      .catch((error) => {
        db.prepare("UPDATE admin_notifications SET status = 'failed' WHERE id = ?").run(Number(result.lastInsertRowid));
        process.stderr.write(`Admin email delivery failed: ${error.message}\n`);
      });
  }
}

function sendSmtpMail(to, subject, body) {
  const tls = require('node:tls');
  return new Promise((resolve, reject) => {
    const socket = tls.connect(Number(process.env.SMTP_PORT || 465), process.env.SMTP_HOST, { servername: process.env.SMTP_HOST });
    let buffer = '';
    let waiting = null;
    let finished = false;
    const fail = (error) => { if (finished) return; finished = true; socket.destroy(); reject(error); };
    socket.setTimeout(12000, () => fail(new Error('SMTP timeout')));
    socket.on('error', fail);
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (/^\d{3} /.test(line) && waiting) { const current = waiting; waiting = null; current(line); }
      }
    });
    const step = (command, accepted) => new Promise((resolveStep, rejectStep) => {
      if (waiting) return rejectStep(new Error('SMTP response overlap'));
      waiting = (line) => {
        const code = Number(line.slice(0, 3));
        if (!accepted.includes(code)) return rejectStep(new Error(`SMTP ${line}`));
        resolveStep(line);
      };
      if (command) socket.write(`${command}\r\n`);
    });
    (async () => {
      try {
        await step('', [220]);
        await step(`EHLO ${os.hostname()}`, [250]);
        await step(`AUTH PLAIN ${Buffer.from(`\0${process.env.SMTP_USER}\0${process.env.SMTP_PASSWORD}`).toString('base64')}`, [235]);
        await step(`MAIL FROM:<${process.env.SMTP_FROM || process.env.SMTP_USER}>`, [250]);
        await step(`RCPT TO:<${to}>`, [250, 251]);
        await step('DATA', [354]);
        const safeSubject = subject.replace(/[\r\n]/g, ' ').slice(0, 180);
        const safeBody = body.replace(/^\./gm, '..');
        socket.write(`From: ${process.env.SMTP_FROM || process.env.SMTP_USER}\r\nTo: ${to}\r\nSubject: ${safeSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(safeBody, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n')}\r\n.\r\n`);
        await step('', [250]);
        await step('QUIT', [221]);
        finished = true;
        socket.end();
        resolve();
      } catch (error) { fail(error); }
    })();
  });
}

function readMediaJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 21 * 1024 * 1024) { reject(Object.assign(new Error('too_large'), { status: 413 })); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('invalid_request'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function validMedia(buffer, type) {
  if (type === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (type === 'video/mp4') return buffer.toString('ascii', 4, 8) === 'ftyp';
  if (type === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

async function handleContentApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/content') {
    const courses = db.prepare("SELECT id, title, description, details, media_path AS mediaPath, status, created_at AS createdAt FROM courses WHERE status = 'published' ORDER BY created_at DESC").all();
    const posts = db.prepare("SELECT id, title, body, media_path AS mediaPath, media_type AS mediaType, status, created_at AS createdAt FROM posts WHERE status = 'published' ORDER BY created_at DESC").all();
    return sendJson(response, 200, { courses, posts });
  }
  const admin = requireAdmin(request, response);
  if (!admin) return;
  if (['POST', 'PATCH', 'DELETE'].includes(request.method) && !allowSameOrigin(request)) return sendJson(response, 403, { error: 'origin' });
  if (request.method === 'GET' && pathname === '/api/admin/content') {
    return sendJson(response, 200, {
      courses: db.prepare('SELECT id, title, description, details, media_path AS mediaPath, status, created_at AS createdAt FROM courses ORDER BY updated_at DESC').all(),
      posts: db.prepare('SELECT id, title, body, media_path AS mediaPath, media_type AS mediaType, status, created_at AS createdAt FROM posts ORDER BY updated_at DESC').all(),
      notifications: db.prepare('SELECT id, subject, body, status, created_at AS createdAt FROM admin_notifications ORDER BY id DESC LIMIT 30').all(),
      notificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'olivineschooldz@gmail.com',
      emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    });
  }
  if (request.method === 'POST' && pathname === '/api/admin/media') {
    let input;
    try { input = await readMediaJson(request); } catch (error) { return sendJson(response, error.status || 400, { error: error.status === 413 ? 'too_large' : 'invalid_request' }); }
    const type = cleanText(input.type, 40);
    const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['video/mp4', '.mp4'], ['video/webm', '.webm']]);
    if (!allowed.has(type) || typeof input.data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(input.data)) return sendJson(response, 400, { error: 'invalid_media' });
    const buffer = Buffer.from(input.data, 'base64');
    if (buffer.length > 15 * 1024 * 1024 || !validMedia(buffer, type)) return sendJson(response, 400, { error: 'invalid_media' });
    const filename = `${crypto.randomUUID()}${allowed.get(type)}`;
    fs.writeFileSync(path.join(mediaRoot, filename), buffer, { flag: 'wx' });
    return sendJson(response, 201, { path: `/media/${filename}`, type });
  }
  const collection = pathname.match(/^\/api\/admin\/(courses|posts)(?:\/(\d+))?$/);
  if (!collection) return sendJson(response, 404, { error: 'not_found' });
  const table = collection[1];
  const id = Number(collection[2] || 0);
  if (request.method === 'POST' && !id) {
    let input;
    try { input = await readJson(request, 64 * 1024); } catch (error) { return sendJson(response, error.status || 400, { error: 'invalid_request' }); }
    const title = cleanText(input.title, 160);
    const body = cleanText(table === 'courses' ? input.description : input.body, 6000);
    const details = cleanText(input.details, 1000);
    const mediaPath = cleanText(input.mediaPath, 120);
    const mediaType = cleanText(input.mediaType, 40);
    const status = input.status === 'draft' ? 'draft' : 'published';
    if (!title || !body) return sendJson(response, 400, { error: 'missing_fields' });
    if (mediaPath && !/^\/media\/[a-f0-9-]+\.(?:jpg|png|webp|mp4|webm)$/i.test(mediaPath)) return sendJson(response, 400, { error: 'invalid_media' });
    if (table === 'posts' && mediaPath && !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(mediaType)) return sendJson(response, 400, { error: 'invalid_media' });
    let result;
    if (table === 'courses') {
      result = db.prepare('INSERT INTO courses (title, description, details, media_path, status, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, body, details, mediaPath, status, admin.id);
      if (status === 'published') recordNotification(`دورة جديدة: ${title}`, `${title}\n\n${body}\n${details}`);
    } else {
      result = db.prepare('INSERT INTO posts (title, body, media_path, media_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, body, mediaPath, mediaType, status, admin.id);
      if (status === 'published') recordNotification(`منشور جديد: ${title}`, `${title}\n\n${body}`);
    }
    return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
  }
  if (request.method === 'PATCH' && id) {
    let input;
    try { input = await readJson(request, 64 * 1024); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const status = input.status === 'draft' ? 'draft' : 'published';
    const previous = db.prepare(`SELECT title, ${table === 'courses' ? 'description' : 'body'} AS body, status FROM ${table} WHERE id = ?`).get(id);
    if (!previous) return sendJson(response, 404, { error: 'not_found' });
    const result = db.prepare(`UPDATE ${table} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);
    if (previous.status !== 'published' && status === 'published') recordNotification(`${table === 'courses' ? 'دورة جديدة' : 'منشور جديد'}: ${previous.title}`, `${previous.title}\n\n${previous.body}`);
    return sendJson(response, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'not_found' });
  }
  if (request.method === 'DELETE' && id) {
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return sendJson(response, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'not_found' });
  }
  return sendJson(response, 405, { error: 'method_not_allowed' });
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/content' || pathname.startsWith('/api/admin/')) return handleContentApi(request, response, pathname);
  if (request.method === 'GET' && pathname === '/api/me') {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    const user = getSessionUser(request);
    sendJson(response, 200, { user: user ? publicUser(user) : null });
    return;
  }

  if (request.method === 'POST' && ['/api/register', '/api/login', '/api/logout'].includes(pathname)) {
    if (!allowSameOrigin(request)) return sendJson(response, 403, { error: 'origin' });
    if (!rateLimit(request)) return sendJson(response, 429, { error: 'rate_limit' }, { 'Retry-After': '900' });
    if (pathname === '/api/logout') {
      const token = readCookie(request, cookieName);
      if (token && token.length <= 100) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashSession(token));
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
      return;
    }

    let input;
    try { input = await readJson(request); } catch (error) {
      return sendJson(response, error.status || 400, { error: error.status === 413 ? 'too_large' : 'invalid_request' });
    }
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { error: 'invalid_email' });
    if (password.length < 12 || password.length > 128) return sendJson(response, 400, { error: 'invalid_password' });

    if (pathname === '/api/register') {
      const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
      if (!name || name.length > 80) return sendJson(response, 400, { error: 'invalid_name' });
      const salt = crypto.randomBytes(16).toString('base64url');
      const passwordHash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
      let result;
      try {
        result = db.prepare('INSERT INTO users (name, email, password_salt, password_hash) VALUES (?, ?, ?, ?)').run(name, email, salt, Buffer.from(passwordHash).toString('base64url'));
      } catch (error) {
        if (error.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed/.test(error.message)) return sendJson(response, 409, { error: 'email_exists' });
        throw error;
      }
      const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
      const token = await createSession(user.id);
      return sendJson(response, 201, { user: publicUser(user) }, { 'Set-Cookie': cookieHeader(token, sessionAge / 1000) });
    }

    const user = db.prepare('SELECT id, name, email, password_salt, password_hash, role FROM users WHERE email = ?').get(email);
    const salt = user?.password_salt || dummySalt;
    const expected = Buffer.from(user?.password_hash || dummyHash, 'base64url');
    const candidate = Buffer.from(await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
    if (!user || expected.length !== candidate.length || !crypto.timingSafeEqual(expected, candidate)) return sendJson(response, 401, { error: 'invalid_credentials' });
    const token = await createSession(user.id);
    return sendJson(response, 200, { user: publicUser(user) }, { 'Set-Cookie': cookieHeader(token, sessionAge / 1000) });
  }
  sendJson(response, 404, { error: 'not_found' });
}

async function handleRequest(request, response) {
  setSecurityHeaders(response);
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400).end('Bad request'); return; }
  if (pathname.startsWith('/api/')) return handleApi(request, response, pathname);
  const asset = staticFiles.get(pathname);
  const mediaMatch = pathname.match(/^\/media\/([a-f0-9-]+\.(?:jpg|png|webp|mp4|webm))$/i);
  if (mediaMatch && (request.method === 'GET' || request.method === 'HEAD')) {
    const file = path.join(mediaRoot, mediaMatch[1]);
    if (!file.startsWith(mediaRoot + path.sep) || !fs.existsSync(file)) { response.writeHead(404).end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    const type = ext === '.jpg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.mp4' ? 'video/mp4' : 'video/webm';
    response.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
    return fs.createReadStream(file).pipe(response);
  }
  if (!asset || request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(asset ? 405 : 404, asset ? { Allow: 'GET, HEAD' } : {}).end(asset ? 'Method not allowed' : 'Not found');
    return;
  }
  fs.readFile(path.join(root, asset[0]), (error, data) => {
    if (error) { response.writeHead(500).end('Unable to read site file'); return; }
    response.writeHead(200, { 'Content-Type': asset[1] });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
}

function start() {
  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (!response.headersSent) sendJson(response, 500, { error: 'server_error' });
      else response.destroy();
    });
  });
  const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  server.listen(port, host, () => process.stdout.write(`Olivine School local app: http://localhost:${port}\n`));
}

if (require.main === module) start();
module.exports = { db, handleRequest, hashSession, publicUser, readCookie };
