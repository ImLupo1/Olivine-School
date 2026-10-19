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
  CREATE TABLE IF NOT EXISTS course_likes (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS course_bookmarks (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS course_comments (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES course_comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS course_comments_order ON course_comments(course_id, created_at ASC);
  CREATE TABLE IF NOT EXISTS course_comment_likes (
    comment_id INTEGER NOT NULL REFERENCES course_comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id)
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
  CREATE TABLE IF NOT EXISTS account_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notify_new_posts INTEGER NOT NULL DEFAULT 1 CHECK (notify_new_posts IN (0, 1)),
    notify_social INTEGER NOT NULL DEFAULT 1 CHECK (notify_social IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS post_likes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS post_bookmarks (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS post_views (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS comments_post_order ON comments(post_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_post', 'post_like', 'comment', 'reply', 'comment_like')),
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS notifications_recipient_order ON notifications(recipient_id, created_at DESC);
`);
// Upgrade databases created before the admin/content features.
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'"); } catch (error) { if (!/duplicate column/i.test(error.message)) throw error; }
for (const [column, definition] of [['avatar_path', "TEXT NOT NULL DEFAULT ''"], ['bio', "TEXT NOT NULL DEFAULT ''"]]) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`); }
  catch (error) { if (!/duplicate column/i.test(error.message)) throw error; }
}
db.prepare('INSERT OR IGNORE INTO account_preferences (user_id) SELECT id FROM users').run();
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
  ['/account-features.css', ['account-features.css', 'text/css; charset=utf-8']],
  ['/black-theme.css', ['black-theme.css', 'text/css; charset=utf-8']],
  ['/theme.js', ['theme.js', 'text/javascript; charset=utf-8']],
  ['/script.js', ['script.js', 'text/javascript; charset=utf-8']],
  ['/account-features.js', ['account-features.js', 'text/javascript; charset=utf-8']],
  ['/locales.js', ['locales.js', 'text/javascript; charset=utf-8']],
  ['/posts', ['posts.html', 'text/html; charset=utf-8']],
  ['/posts.html', ['posts.html', 'text/html; charset=utf-8']],
  ['/posts.css', ['posts.css', 'text/css; charset=utf-8']],
  ['/posts-social.css', ['posts-social.css', 'text/css; charset=utf-8']],
  ['/posts.js', ['posts.js', 'text/javascript; charset=utf-8']],
  ['/olivine-logo-display.jpg', ['olivine-logo-display.jpg', 'image/jpeg']],
  ['/olivine-logo-original.jpg', ['olivine-logo-original.jpg', 'image/jpeg']],
  ['/assets/flags/en.svg', ['assets/flags/en.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/flags/fr.svg', ['assets/flags/fr.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/flags/tr.svg', ['assets/flags/tr.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/flags/es.svg', ['assets/flags/es.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/flags/de.svg', ['assets/flags/de.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/flags/dz.svg', ['assets/flags/dz.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/olivine-building.png', ['assets/olivine-building.png', 'image/png']],
  ['/admin', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.html', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.css', ['admin.css', 'text/css; charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript; charset=utf-8']],
]);
const attempts = new Map();
const rateLimitWindow = 15 * 60 * 1000;
const rateLimitCount = 10;
const maxRateLimitKeys = 10000;
const dummySalt = crypto.randomBytes(16).toString('base64url');
const dummyHash = crypto.scryptSync('timing-only-password', dummySalt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('base64url');

function hashSession(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setSecurityHeaders(response, pathname) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  if (pathname.startsWith('/api/')) response.setHeader('Cache-Control', 'no-store');
  else if (pathname.startsWith('/media/')) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else if (pathname === '/' || pathname.endsWith('.html') || pathname === '/posts' || pathname === '/admin') response.setHeader('Cache-Control', 'no-cache');
  else response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
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
  pruneRateLimitKeys(attempts, now, rateLimitWindow);
  if (!attempts.has(key) && attempts.size >= maxRateLimitKeys) attempts.delete(attempts.keys().next().value);
  const recent = (attempts.get(key) || []).filter((time) => now - time < rateLimitWindow);
  if (recent.length >= rateLimitCount) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

function pruneRateLimitKeys(map, now, windowMs) {
  if (now - (map.lastPrunedAt || 0) < 60 * 1000) return;
  map.lastPrunedAt = now;
  for (const [key, timestamps] of map) {
    const active = timestamps.filter((time) => now - time < windowMs);
    if (active.length) map.set(key, active);
    else map.delete(key);
  }
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
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON object required');
        resolve(value);
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
  return { id: row.id, name: row.name, email: row.email, role: row.role || 'student', avatarPath: row.avatar_path || row.avatarPath || '', bio: row.bio || '' };
}

function getSessionUser(request) {
  const token = readCookie(request, cookieName);
  if (!token || token.length > 100) return null;
  const row = db.prepare(`SELECT users.id, users.name, users.email, users.role, users.avatar_path, users.bio
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

const interactionAttempts = new Map();
function rateLimitInteraction(request) {
  const now = Date.now();
  const key = request.socket.remoteAddress || 'unknown';
  pruneRateLimitKeys(interactionAttempts, now, 10 * 60 * 1000);
  if (!interactionAttempts.has(key) && interactionAttempts.size >= maxRateLimitKeys) interactionAttempts.delete(interactionAttempts.keys().next().value);
  const recent = (interactionAttempts.get(key) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 45) { interactionAttempts.set(key, recent); return false; }
  recent.push(now);
  interactionAttempts.set(key, recent);
  return true;
}

function requireMember(request, response) {
  const user = getSessionUser(request);
  if (!user) { sendJson(response, 401, { error: 'unauthorized' }); return null; }
  return user;
}

function getPublishedPost(id) {
  return db.prepare("SELECT id, title, created_by AS createdBy FROM posts WHERE id = ? AND status = 'published'").get(id);
}

function getPublishedCourse(id) {
  return db.prepare("SELECT id, title, created_by AS createdBy FROM courses WHERE id = ? AND status = 'published'").get(id);
}

function notifyUser(recipientId, actorId, postId, commentId, type) {
  if (!recipientId || recipientId === actorId) return;
  const preferences = db.prepare('SELECT notify_social FROM account_preferences WHERE user_id = ?').get(recipientId);
  if (!preferences || !preferences.notify_social) return;
  db.prepare('INSERT INTO notifications (recipient_id, actor_id, post_id, comment_id, type) VALUES (?, ?, ?, ?, ?)').run(recipientId, actorId, postId, commentId || null, type);
}

function notifyPostSubscribers(postId, actorId) {
  db.prepare(`INSERT INTO notifications (recipient_id, actor_id, post_id, type)
    SELECT user_id, ?, ?, 'new_post' FROM account_preferences
    WHERE notify_new_posts = 1 AND user_id <> ?`).run(actorId, postId, actorId);
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
        const safeSubject = `=?UTF-8?B?${Buffer.from(subject.replace(/[\r\n]/g, ' ').slice(0, 180), 'utf8').toString('base64')}?=`;
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
    const contentType = (request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      request.resume();
      return reject(Object.assign(new Error('Unsupported content type'), { status: 415 }));
    }
    let size = 0;
    const chunks = [];
    let tooLarge = false;
    request.on('data', (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > 21 * 1024 * 1024) {
        tooLarge = true;
        chunks.length = 0;
        reject(Object.assign(new Error('too_large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) return;
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON object required');
        resolve(value);
      }
      catch { reject(Object.assign(new Error('invalid_request'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function removeMedia(mediaPath) {
  if (typeof mediaPath !== 'string' || !/^\/media\/[a-f0-9-]+\.(?:jpg|png|webp|mp4|webm)$/i.test(mediaPath)) return;
  const file = path.join(mediaRoot, path.basename(mediaPath));
  if (file.startsWith(mediaRoot + path.sep)) {
    try { fs.unlinkSync(file); } catch (error) {
      if (error.code !== 'ENOENT') process.stderr.write(`Media cleanup failed: ${error.message}\n`);
    }
  }
}

function validMedia(buffer, type) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (type === 'image/jpeg') {
    if (buffer.length < 16 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) return false;
    for (let offset = 2; offset + 9 < buffer.length - 2; offset++) {
      if (buffer[offset] !== 0xff) continue;
      const marker = buffer[offset + 1];
      if (![0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) continue;
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 8 || offset + 2 + segmentLength > buffer.length) return false;
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return width > 0 && height > 0 && width <= 32768 && height <= 32768;
    }
    return false;
  }
  if (type === 'image/png') {
    if (buffer.length < 45 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
    let offset = 8;
    let hasHeader = false;
    let hasData = false;
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const kind = buffer.toString('ascii', offset + 4, offset + 8);
      const dataEnd = offset + 8 + length;
      if (dataEnd + 4 > buffer.length) return false;
      if (!hasHeader) {
        if (kind !== 'IHDR' || length !== 13) return false;
        const width = buffer.readUInt32BE(offset + 8);
        const height = buffer.readUInt32BE(offset + 12);
        if (!width || !height || width > 32768 || height > 32768) return false;
        hasHeader = true;
      } else if (kind === 'IHDR') return false;
      if (kind === 'IDAT') hasData = true;
      offset = dataEnd + 4;
      if (kind === 'IEND') return length === 0 && hasHeader && hasData && offset === buffer.length;
    }
    return false;
  }
  if (type === 'image/webp') {
    if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP' || buffer.readUInt32LE(4) + 8 !== buffer.length) return false;
    let offset = 12;
    let hasImage = false;
    while (offset + 8 <= buffer.length) {
      const kind = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt32LE(offset + 4);
      const end = offset + 8 + length;
      if (end > buffer.length) return false;
      if ((kind === 'VP8 ' && length >= 10) || (kind === 'VP8L' && length >= 5) || (kind === 'VP8X' && length >= 10)) hasImage = true;
      offset = end + (length % 2);
    }
    return hasImage && offset === buffer.length;
  }
  if (type === 'video/mp4') {
    if (buffer.length < 24) return false;
    let offset = 0;
    let hasBrand = false;
    let hasPayload = false;
    while (offset + 8 <= buffer.length) {
      let size = buffer.readUInt32BE(offset);
      const kind = buffer.toString('ascii', offset + 4, offset + 8);
      let headerSize = 8;
      if (size === 1) {
        if (offset + 16 > buffer.length) return false;
        const largeSize = buffer.readBigUInt64BE(offset + 8);
        if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return false;
        size = Number(largeSize);
        headerSize = 16;
      } else if (size === 0) size = buffer.length - offset;
      if (size < headerSize || offset + size > buffer.length) return false;
      if (kind === 'ftyp' && size >= headerSize + 8) hasBrand = true;
      if (kind === 'moov' || kind === 'mdat' || kind === 'moof') hasPayload = true;
      offset += size;
    }
    return hasBrand && hasPayload && offset === buffer.length;
  }
  if (type === 'video/webm') {
    const ebmlHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    const segment = Buffer.from([0x18, 0x53, 0x80, 0x67]);
    return buffer.length >= 32 && buffer.subarray(0, 4).equals(ebmlHeader) && buffer.indexOf(Buffer.from('webm')) >= 0 && buffer.indexOf(segment) >= 0;
  }
  return false;
}

async function handleContentApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/content') {
    const viewer = getSessionUser(request);
    const courses = db.prepare(`SELECT c.id, c.title, c.description, c.details, c.media_path AS mediaPath, c.status, c.created_at AS createdAt,
      CASE WHEN lower(c.media_path) LIKE '%.mp4' THEN 'video/mp4' WHEN lower(c.media_path) LIKE '%.webm' THEN 'video/webm' ELSE '' END AS mediaType,
      (SELECT COUNT(*) FROM course_likes l WHERE l.course_id = c.id) AS likeCount,
      (SELECT COUNT(*) FROM course_comments cc WHERE cc.course_id = c.id AND cc.is_hidden = 0) AS commentCount,
      EXISTS(SELECT 1 FROM course_likes l WHERE l.course_id = c.id AND l.user_id = ?) AS likedByMe,
      EXISTS(SELECT 1 FROM course_bookmarks b WHERE b.course_id = c.id AND b.user_id = ?) AS bookmarkedByMe
      FROM courses c WHERE c.status = 'published' ORDER BY c.created_at DESC`).all(viewer?.id || 0, viewer?.id || 0);
    const posts = db.prepare(`SELECT p.id, p.title, p.body, p.media_path AS mediaPath, p.media_type AS mediaType, p.status, p.created_at AS createdAt,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likeCount,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.is_hidden = 0) AS commentCount,
      EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS likedByMe,
      EXISTS(SELECT 1 FROM post_bookmarks b WHERE b.post_id = p.id AND b.user_id = ?) AS bookmarkedByMe
      FROM posts p WHERE p.status = 'published' ORDER BY p.created_at DESC`).all(viewer?.id || 0, viewer?.id || 0);
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
  if (request.method === 'DELETE' && pathname === '/api/admin/media') {
    let input;
    try { input = await readJson(request, 1024); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const mediaPath = cleanText(input.path, 120);
    if (!/^\/media\/[a-f0-9-]+\.(?:jpg|png|webp|mp4|webm)$/i.test(mediaPath)) return sendJson(response, 400, { error: 'invalid_media' });
    const referenced = db.prepare('SELECT 1 FROM courses WHERE media_path = ? UNION ALL SELECT 1 FROM posts WHERE media_path = ? LIMIT 1').get(mediaPath, mediaPath);
    if (referenced) return sendJson(response, 409, { error: 'media_in_use' });
    removeMedia(mediaPath);
    return sendJson(response, 200, { ok: true });
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
    if (mediaPath) {
      const ext = path.extname(mediaPath).toLowerCase();
      const expectedType = ({ '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm' })[ext];
      if (!expectedType || (table === 'posts' && mediaType !== expectedType) || !fs.existsSync(path.join(mediaRoot, path.basename(mediaPath)))) return sendJson(response, 400, { error: 'invalid_media' });
    }
    let result;
    if (table === 'courses') {
      result = db.prepare('INSERT INTO courses (title, description, details, media_path, status, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, body, details, mediaPath, status, admin.id);
      if (status === 'published') recordNotification(`دورة جديدة: ${title}`, `${title}\n\n${body}\n${details}`);
    } else {
      result = db.prepare('INSERT INTO posts (title, body, media_path, media_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, body, mediaPath, mediaType, status, admin.id);
      if (status === 'published') {
        recordNotification(`منشور جديد: ${title}`, `${title}\n\n${body}`);
        notifyPostSubscribers(Number(result.lastInsertRowid), admin.id);
      }
    }
    return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
  }
  if (request.method === 'PATCH' && id) {
    let input;
    try { input = await readJson(request, 64 * 1024); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const status = input.status === 'draft' ? 'draft' : 'published';
    const previous = db.prepare(`SELECT title, ${table === 'courses' ? 'description' : 'body'} AS body, status, created_by AS createdBy FROM ${table} WHERE id = ?`).get(id);
    if (!previous) return sendJson(response, 404, { error: 'not_found' });
    const result = db.prepare(`UPDATE ${table} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);
    if (previous.status !== 'published' && status === 'published') {
      recordNotification(`${table === 'courses' ? 'دورة جديدة' : 'منشور جديد'}: ${previous.title}`, `${previous.title}\n\n${previous.body}`);
      if (table === 'posts') notifyPostSubscribers(id, previous.createdBy || admin.id);
    }
    return sendJson(response, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'not_found' });
  }
  if (request.method === 'DELETE' && id) {
    const existing = db.prepare(`SELECT media_path AS mediaPath FROM ${table} WHERE id = ?`).get(id);
    if (!existing) return sendJson(response, 404, { error: 'not_found' });
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    if (result.changes) {
      const referenced = db.prepare('SELECT 1 FROM courses WHERE media_path = ? UNION ALL SELECT 1 FROM posts WHERE media_path = ? LIMIT 1').get(existing.mediaPath, existing.mediaPath);
      if (!referenced) removeMedia(existing.mediaPath);
    }
    return sendJson(response, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'not_found' });
  }
  return sendJson(response, 405, { error: 'method_not_allowed' });
}

async function handleMemberApi(request, response, pathname) {
  const socialMatch = pathname.match(/^\/api\/posts\/(\d+)\/social$/);
  const courseSocialMatch = pathname.match(/^\/api\/courses\/(\d+)\/social$/);
  if (request.method === 'GET' && socialMatch) {
    const postId = Number(socialMatch[1]);
    if (!getPublishedPost(postId)) return sendJson(response, 404, { error: 'not_found' });
    const user = getSessionUser(request);
    const comments = db.prepare(`SELECT c.id, c.post_id AS postId, c.user_id AS userId, c.parent_id AS parentId,
        c.body, c.created_at AS createdAt, c.updated_at AS updatedAt,
        u.name, u.avatar_path AS avatarPath,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likeCount,
        EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS likedByMe
      FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? AND c.is_hidden = 0
      ORDER BY c.created_at ASC, c.id ASC LIMIT 300`).all(user?.id || 0, postId);
    const likeCount = db.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?').get(postId).count;
    const commentCount = db.prepare('SELECT COUNT(*) AS count FROM comments WHERE post_id = ? AND is_hidden = 0').get(postId).count;
    return sendJson(response, 200, {
      user: user ? publicUser(user) : null,
      likeCount,
      commentCount,
      likedByMe: user ? Boolean(db.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, user.id)) : false,
      bookmarkedByMe: user ? Boolean(db.prepare('SELECT 1 FROM post_bookmarks WHERE post_id = ? AND user_id = ?').get(postId, user.id)) : false,
      comments,
    });
  }

  if (request.method === 'GET' && courseSocialMatch) {
    const courseId = Number(courseSocialMatch[1]);
    if (!getPublishedCourse(courseId)) return sendJson(response, 404, { error: 'not_found' });
    const user = getSessionUser(request);
    const comments = db.prepare(`SELECT c.id, c.course_id AS courseId, c.user_id AS userId, c.parent_id AS parentId,
        c.body, c.created_at AS createdAt, c.updated_at AS updatedAt,
        u.name, u.avatar_path AS avatarPath,
        (SELECT COUNT(*) FROM course_comment_likes cl WHERE cl.comment_id = c.id) AS likeCount,
        EXISTS(SELECT 1 FROM course_comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS likedByMe
      FROM course_comments c JOIN users u ON u.id = c.user_id
      WHERE c.course_id = ? AND c.is_hidden = 0 ORDER BY c.created_at ASC, c.id ASC LIMIT 300`).all(user?.id || 0, courseId);
    return sendJson(response, 200, {
      user: user ? publicUser(user) : null,
      likeCount: db.prepare('SELECT COUNT(*) AS count FROM course_likes WHERE course_id = ?').get(courseId).count,
      commentCount: db.prepare('SELECT COUNT(*) AS count FROM course_comments WHERE course_id = ? AND is_hidden = 0').get(courseId).count,
      likedByMe: user ? Boolean(db.prepare('SELECT 1 FROM course_likes WHERE course_id = ? AND user_id = ?').get(courseId, user.id)) : false,
      bookmarkedByMe: user ? Boolean(db.prepare('SELECT 1 FROM course_bookmarks WHERE course_id = ? AND user_id = ?').get(courseId, user.id)) : false,
      comments,
    });
  }

  const postAction = pathname.match(/^\/api\/posts\/(\d+)\/(like|bookmark|view|comments)$/);
  const courseAction = pathname.match(/^\/api\/courses\/(\d+)\/(like|bookmark|comments)$/);
  const commentAction = pathname.match(/^\/api\/comments\/(\d+)(?:\/(like))?$/);
  const courseCommentAction = pathname.match(/^\/api\/course-comments\/(\d+)(?:\/(like))?$/);
  const isMemberRoute = pathname.startsWith('/api/me/') || postAction || courseAction || commentAction || courseCommentAction;
  if (!isMemberRoute) return sendJson(response, 404, { error: 'not_found' });
  if (!['GET', 'HEAD'].includes(request.method) && !allowSameOrigin(request)) return sendJson(response, 403, { error: 'origin' });
  const user = requireMember(request, response);
  if (!user) return;

  if (request.method === 'GET' && pathname === '/api/me/dashboard') {
    const preferences = db.prepare('SELECT notify_new_posts AS notifyNewPosts, notify_social AS notifySocial FROM account_preferences WHERE user_id = ?').get(user.id) || { notifyNewPosts: 1, notifySocial: 1 };
    const savedPosts = db.prepare(`SELECT p.id, p.title, p.created_at AS createdAt, b.created_at AS savedAt, 'post' AS kind
      FROM post_bookmarks b JOIN posts p ON p.id = b.post_id WHERE b.user_id = ? AND p.status = 'published'
      UNION ALL
      SELECT c.id, c.title, c.created_at AS createdAt, b.created_at AS savedAt, 'course' AS kind
      FROM course_bookmarks b JOIN courses c ON c.id = b.course_id WHERE b.user_id = ? AND c.status = 'published'
      ORDER BY savedAt DESC LIMIT 12`).all(user.id, user.id);
    const recentPosts = db.prepare(`SELECT p.id, p.title, p.created_at AS createdAt, v.last_viewed_at AS lastViewedAt
      FROM post_views v JOIN posts p ON p.id = v.post_id WHERE v.user_id = ? AND p.status = 'published'
      ORDER BY v.last_viewed_at DESC LIMIT 8`).all(user.id);
    const notifications = db.prepare(`SELECT n.id, n.type, n.post_id AS postId, n.comment_id AS commentId, n.read_at AS readAt,
        n.created_at AS createdAt, actor.name AS actorName, actor.avatar_path AS actorAvatar, p.title AS postTitle
      FROM notifications n LEFT JOIN users actor ON actor.id = n.actor_id LEFT JOIN posts p ON p.id = n.post_id
      WHERE n.recipient_id = ? ORDER BY n.created_at DESC, n.id DESC LIMIT 20`).all(user.id);
    const stats = {
      saved: db.prepare('SELECT (SELECT COUNT(*) FROM post_bookmarks WHERE user_id = ?) + (SELECT COUNT(*) FROM course_bookmarks WHERE user_id = ?) AS count').get(user.id, user.id).count,
      viewed: db.prepare('SELECT COUNT(*) AS count FROM post_views WHERE user_id = ?').get(user.id).count,
      comments: db.prepare('SELECT (SELECT COUNT(*) FROM comments WHERE user_id = ? AND is_hidden = 0) + (SELECT COUNT(*) FROM course_comments WHERE user_id = ? AND is_hidden = 0) AS count').get(user.id, user.id).count,
      likes: db.prepare('SELECT (SELECT COUNT(*) FROM post_likes WHERE user_id = ?) + (SELECT COUNT(*) FROM course_likes WHERE user_id = ?) AS count').get(user.id, user.id).count,
      unread: db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND read_at IS NULL').get(user.id).count,
      otherSessions: db.prepare('SELECT COUNT(*) AS count FROM sessions WHERE user_id = ? AND token_hash <> ? AND expires_at > ?').get(user.id, hashSession(readCookie(request, cookieName)), Date.now()).count,
    };
    return sendJson(response, 200, { profile: publicUser(user), stats, preferences, savedPosts, recentPosts, notifications });
  }

  if (request.method === 'PATCH' && pathname === '/api/me/profile') {
    let input;
    try { input = await readJson(request, 4096); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const name = cleanText(input.name, 80).replace(/\s+/g, ' ');
    const bio = cleanText(input.bio, 280);
    if (!name) return sendJson(response, 400, { error: 'invalid_name' });
    db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').run(name, bio, user.id);
    return sendJson(response, 200, { user: publicUser(db.prepare('SELECT id, name, email, role, avatar_path, bio FROM users WHERE id = ?').get(user.id)) });
  }

  if (pathname === '/api/me/avatar' && request.method === 'POST') {
    let input;
    try { input = await readMediaJson(request); } catch (error) { return sendJson(response, error.status || 400, { error: error.status === 413 ? 'too_large' : 'invalid_request' }); }
    const type = cleanText(input.type, 40);
    const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[type];
    if (!extension || typeof input.data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(input.data)) return sendJson(response, 400, { error: 'invalid_media' });
    const buffer = Buffer.from(input.data, 'base64');
    if (!buffer.length || buffer.length > 3 * 1024 * 1024 || !validMedia(buffer, type)) return sendJson(response, 400, { error: 'invalid_media' });
    const filename = `${crypto.randomUUID()}${extension}`;
    fs.writeFileSync(path.join(mediaRoot, filename), buffer, { flag: 'wx' });
    const avatarPath = `/media/${filename}`;
    const previous = user.avatar_path;
    db.prepare('UPDATE users SET avatar_path = ? WHERE id = ?').run(avatarPath, user.id);
    if (previous && !db.prepare('SELECT 1 FROM users WHERE avatar_path = ?').get(previous)) removeMedia(previous);
    return sendJson(response, 201, { avatarPath });
  }

  if (pathname === '/api/me/avatar' && request.method === 'DELETE') {
    const previous = user.avatar_path;
    db.prepare("UPDATE users SET avatar_path = '' WHERE id = ?").run(user.id);
    if (previous && !db.prepare('SELECT 1 FROM users WHERE avatar_path = ?').get(previous)) removeMedia(previous);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'PATCH' && pathname === '/api/me/preferences') {
    let input;
    try { input = await readJson(request, 2048); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const current = db.prepare('SELECT notify_new_posts AS notifyNewPosts, notify_social AS notifySocial FROM account_preferences WHERE user_id = ?').get(user.id) || { notifyNewPosts: 1, notifySocial: 1 };
    const notifyNewPosts = typeof input.notifyNewPosts === 'boolean' ? Number(input.notifyNewPosts) : current.notifyNewPosts;
    const notifySocial = typeof input.notifySocial === 'boolean' ? Number(input.notifySocial) : current.notifySocial;
    db.prepare(`INSERT INTO account_preferences (user_id, notify_new_posts, notify_social) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET notify_new_posts = excluded.notify_new_posts, notify_social = excluded.notify_social, updated_at = CURRENT_TIMESTAMP`).run(user.id, notifyNewPosts, notifySocial);
    return sendJson(response, 200, { notifyNewPosts: Boolean(notifyNewPosts), notifySocial: Boolean(notifySocial) });
  }

  if (request.method === 'PATCH' && pathname === '/api/me/password') {
    if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
    let input;
    try { input = await readJson(request, 2048); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : '';
    const newPassword = typeof input.newPassword === 'string' ? input.newPassword : '';
    if (newPassword.length < 12 || newPassword.length > 128) return sendJson(response, 400, { error: 'invalid_password' });
    const fullUser = db.prepare('SELECT password_salt AS salt, password_hash AS passwordHash FROM users WHERE id = ?').get(user.id);
    const candidate = Buffer.from(await scrypt(currentPassword, fullUser.salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
    const expected = Buffer.from(fullUser.passwordHash, 'base64url');
    if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) return sendJson(response, 401, { error: 'invalid_current_password' });
    const salt = crypto.randomBytes(16).toString('base64url');
    const passwordHash = await scrypt(newPassword, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, Buffer.from(passwordHash).toString('base64url'), user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(user.id, hashSession(readCookie(request, cookieName)));
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'DELETE' && pathname === '/api/me/sessions/others') {
    const result = db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(user.id, hashSession(readCookie(request, cookieName)));
    return sendJson(response, 200, { revoked: result.changes });
  }

  if (request.method === 'POST' && pathname === '/api/me/notifications/read-all') {
    db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND read_at IS NULL').run(user.id);
    return sendJson(response, 200, { ok: true });
  }
  const notificationMatch = pathname.match(/^\/api\/me\/notifications\/(\d+)$/);
  if (request.method === 'PATCH' && notificationMatch) {
    const id = Number(notificationMatch[1]);
    let input;
    try { input = await readJson(request, 1024); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const result = input.read === false
      ? db.prepare('UPDATE notifications SET read_at = NULL WHERE id = ? AND recipient_id = ?').run(id, user.id)
      : db.prepare('UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_id = ?').run(id, user.id);
    return sendJson(response, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'not_found' });
  }

  if (request.method === 'POST' && postAction) {
    const postId = Number(postAction[1]);
    const action = postAction[2];
    const post = getPublishedPost(postId);
    if (!post) return sendJson(response, 404, { error: 'not_found' });
    if (action === 'view') {
      db.prepare(`INSERT INTO post_views (post_id, user_id) VALUES (?, ?) ON CONFLICT(post_id, user_id)
        DO UPDATE SET last_viewed_at = CURRENT_TIMESTAMP`).run(postId, user.id);
      return sendJson(response, 200, { ok: true });
    }
    if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
    if (action === 'like') {
      const exists = db.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, user.id);
      if (exists) db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
      else {
        db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(postId, user.id);
        notifyUser(post.createdBy, user.id, postId, null, 'post_like');
      }
      return sendJson(response, 200, { liked: !exists, likeCount: db.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?').get(postId).count });
    }
    if (action === 'bookmark') {
      const exists = db.prepare('SELECT 1 FROM post_bookmarks WHERE post_id = ? AND user_id = ?').get(postId, user.id);
      if (exists) db.prepare('DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?').run(postId, user.id);
      else db.prepare('INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)').run(postId, user.id);
      return sendJson(response, 200, { bookmarked: !exists });
    }
    if (action === 'comments') {
      if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
      let input;
      try { input = await readJson(request, 4096); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
      const body = cleanText(input.body, 2000);
      if (!body) return sendJson(response, 400, { error: 'empty_comment' });
      const parentId = Number(input.parentId || 0);
      let recipientId = post.createdBy;
      let type = 'comment';
      if (parentId) {
        const parent = db.prepare('SELECT id, user_id AS userId, parent_id AS parentId FROM comments WHERE id = ? AND post_id = ? AND is_hidden = 0').get(parentId, postId);
        if (!parent || parent.parentId) return sendJson(response, 400, { error: 'invalid_reply_target' });
        recipientId = parent.userId;
        type = 'reply';
      }
      const result = db.prepare('INSERT INTO comments (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)').run(postId, user.id, parentId || null, body);
      notifyUser(recipientId, user.id, postId, Number(result.lastInsertRowid), type);
      return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
    }
  }

  if (request.method === 'POST' && courseAction) {
    const courseId = Number(courseAction[1]);
    const action = courseAction[2];
    if (!getPublishedCourse(courseId)) return sendJson(response, 404, { error: 'not_found' });
    if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
    if (action === 'like') {
      const exists = db.prepare('SELECT 1 FROM course_likes WHERE course_id = ? AND user_id = ?').get(courseId, user.id);
      if (exists) db.prepare('DELETE FROM course_likes WHERE course_id = ? AND user_id = ?').run(courseId, user.id);
      else db.prepare('INSERT INTO course_likes (course_id, user_id) VALUES (?, ?)').run(courseId, user.id);
      return sendJson(response, 200, { liked: !exists, likeCount: db.prepare('SELECT COUNT(*) AS count FROM course_likes WHERE course_id = ?').get(courseId).count });
    }
    if (action === 'bookmark') {
      const exists = db.prepare('SELECT 1 FROM course_bookmarks WHERE course_id = ? AND user_id = ?').get(courseId, user.id);
      if (exists) db.prepare('DELETE FROM course_bookmarks WHERE course_id = ? AND user_id = ?').run(courseId, user.id);
      else db.prepare('INSERT INTO course_bookmarks (course_id, user_id) VALUES (?, ?)').run(courseId, user.id);
      return sendJson(response, 200, { bookmarked: !exists });
    }
    if (action === 'comments') {
      let input;
      try { input = await readJson(request, 4096); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
      const body = cleanText(input.body, 2000);
      if (!body) return sendJson(response, 400, { error: 'empty_comment' });
      const parentId = Number(input.parentId || 0);
      if (parentId) {
        const parent = db.prepare('SELECT id, parent_id AS parentId FROM course_comments WHERE id = ? AND course_id = ? AND is_hidden = 0').get(parentId, courseId);
        if (!parent || parent.parentId) return sendJson(response, 400, { error: 'invalid_reply_target' });
      }
      const result = db.prepare('INSERT INTO course_comments (course_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)').run(courseId, user.id, parentId || null, body);
      return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
    }
  }

  if (request.method === 'POST' && commentAction?.[2] === 'like') {
    if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
    const commentId = Number(commentAction[1]);
    const comment = db.prepare(`SELECT c.id, c.post_id AS postId, c.user_id AS userId FROM comments c
      JOIN posts p ON p.id = c.post_id WHERE c.id = ? AND c.is_hidden = 0 AND p.status = 'published'`).get(commentId);
    if (!comment) return sendJson(response, 404, { error: 'not_found' });
    const exists = db.prepare('SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?').get(commentId, user.id);
    if (exists) db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(commentId, user.id);
    else {
      db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(commentId, user.id);
      notifyUser(comment.userId, user.id, comment.postId, commentId, 'comment_like');
    }
    return sendJson(response, 200, { liked: !exists, likeCount: db.prepare('SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id = ?').get(commentId).count });
  }

  if (commentAction && !commentAction[2] && ['PATCH', 'DELETE'].includes(request.method)) {
    const commentId = Number(commentAction[1]);
    const comment = db.prepare('SELECT id, user_id AS userId FROM comments WHERE id = ?').get(commentId);
    if (!comment) return sendJson(response, 404, { error: 'not_found' });
    if (comment.userId !== user.id && user.role !== 'admin') return sendJson(response, 403, { error: 'forbidden' });
    if (request.method === 'DELETE') {
      db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
      return sendJson(response, 200, { ok: true });
    }
    let input;
    try { input = await readJson(request, 4096); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const body = cleanText(input.body, 2000);
    if (!body) return sendJson(response, 400, { error: 'empty_comment' });
    db.prepare('UPDATE comments SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(body, commentId);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'POST' && courseCommentAction?.[2] === 'like') {
    if (!rateLimitInteraction(request)) return sendJson(response, 429, { error: 'rate_limit' });
    const commentId = Number(courseCommentAction[1]);
    const comment = db.prepare(`SELECT c.id FROM course_comments c JOIN courses s ON s.id = c.course_id
      WHERE c.id = ? AND c.is_hidden = 0 AND s.status = 'published'`).get(commentId);
    if (!comment) return sendJson(response, 404, { error: 'not_found' });
    const exists = db.prepare('SELECT 1 FROM course_comment_likes WHERE comment_id = ? AND user_id = ?').get(commentId, user.id);
    if (exists) db.prepare('DELETE FROM course_comment_likes WHERE comment_id = ? AND user_id = ?').run(commentId, user.id);
    else db.prepare('INSERT INTO course_comment_likes (comment_id, user_id) VALUES (?, ?)').run(commentId, user.id);
    return sendJson(response, 200, { liked: !exists, likeCount: db.prepare('SELECT COUNT(*) AS count FROM course_comment_likes WHERE comment_id = ?').get(commentId).count });
  }

  if (courseCommentAction && !courseCommentAction[2] && ['PATCH', 'DELETE'].includes(request.method)) {
    const commentId = Number(courseCommentAction[1]);
    const comment = db.prepare('SELECT id, user_id AS userId FROM course_comments WHERE id = ?').get(commentId);
    if (!comment) return sendJson(response, 404, { error: 'not_found' });
    if (comment.userId !== user.id && user.role !== 'admin') return sendJson(response, 403, { error: 'forbidden' });
    if (request.method === 'DELETE') {
      db.prepare('DELETE FROM course_comments WHERE id = ?').run(commentId);
      return sendJson(response, 200, { ok: true });
    }
    let input;
    try { input = await readJson(request, 4096); } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
    const body = cleanText(input.body, 2000);
    if (!body) return sendJson(response, 400, { error: 'empty_comment' });
    db.prepare('UPDATE course_comments SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(body, commentId);
    return sendJson(response, 200, { ok: true });
  }

  return sendJson(response, 405, { error: 'method_not_allowed' });
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/content' || pathname.startsWith('/api/admin/')) return handleContentApi(request, response, pathname);
  if (pathname.startsWith('/api/me/') || pathname.startsWith('/api/posts/') || pathname.startsWith('/api/comments/') || pathname.startsWith('/api/courses/') || pathname.startsWith('/api/course-comments/')) return handleMemberApi(request, response, pathname);
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
      db.prepare('INSERT OR IGNORE INTO account_preferences (user_id) VALUES (?)').run(Number(result.lastInsertRowid));
      const user = db.prepare('SELECT id, name, email, role, avatar_path, bio FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
      const token = await createSession(user.id);
      return sendJson(response, 201, { user: publicUser(user) }, { 'Set-Cookie': cookieHeader(token, sessionAge / 1000) });
    }

    const user = db.prepare('SELECT id, name, email, password_salt, password_hash, role, avatar_path, bio FROM users WHERE email = ?').get(email);
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
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400).end('Bad request'); return; }
  setSecurityHeaders(response, pathname);
  if (pathname.startsWith('/api/')) return handleApi(request, response, pathname);
  const asset = staticFiles.get(pathname);
  const mediaMatch = pathname.match(/^\/media\/([a-f0-9-]+\.(?:jpg|png|webp|mp4|webm))$/i);
  if (mediaMatch && (request.method === 'GET' || request.method === 'HEAD')) {
    const file = path.join(mediaRoot, mediaMatch[1]);
    if (!file.startsWith(mediaRoot + path.sep) || !fs.existsSync(file)) { response.writeHead(404).end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    const type = ext === '.jpg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.mp4' ? 'video/mp4' : 'video/webm';
    const { size } = fs.statSync(file);
    const range = request.headers.range;
    if (range && type.startsWith('video/')) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' }).end();
        return;
      }
      let start;
      let end;
      if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
          response.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' }).end();
          return;
        }
        start = Math.max(0, size - suffixLength);
        end = size - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' }).end();
        return;
      }
      response.writeHead(206, { 'Content-Type': type, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes' });
      return request.method === 'HEAD' ? response.end() : fs.createReadStream(file, { start, end }).pipe(response);
    }
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': type.startsWith('video/') ? 'bytes' : 'none' });
    return request.method === 'HEAD' ? response.end() : fs.createReadStream(file).pipe(response);
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
