const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { promisify } = require('node:util');
const readline = require('node:readline');

const root = __dirname;
const envFile = path.join(root, '.env');
for (const line of (fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (label) => new Promise((resolve) => rl.question(label, resolve));
function askPassword() {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) return ask('كلمة مرور المدير (12 خانة على الأقل): ');
  return new Promise((resolve) => {
    process.stdout.write('كلمة مرور المدير (12 خانة على الأقل): ');
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    let value = '';
    const done = () => { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.removeListener('keypress', onKey); process.stdout.write('\n'); resolve(value); };
    const onKey = (char, key = {}) => {
      if (key.ctrl && key.name === 'c') { process.stdout.write('\n'); process.exit(130); }
      if (key.name === 'return' || key.name === 'enter') return done();
      if (key.name === 'backspace') { value = value.slice(0, -1); process.stdout.write('\b \b'); return; }
      if (char && !key.ctrl && !key.meta && char.length === 1) { value += char; process.stdout.write('*'); }
    };
    process.stdin.on('keypress', onKey);
    process.stdin.resume();
  });
}

(async () => {
  const email = (await ask('البريد الإلكتروني للمدير: ')).trim().toLowerCase();
  const name = (await ask('اسم المدير: ')).trim().replace(/\s+/g, ' ');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('البريد الإلكتروني غير صالح.');
  if (!name || name.length > 80) throw new Error('الاسم مطلوب (حتى 80 حرفاً).');
  const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'olivine.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  try { db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'"); } catch (error) { if (!/duplicate column/i.test(error.message)) throw error; }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare("UPDATE users SET name = ?, role = 'admin' WHERE id = ?").run(name, existing.id);
    rl.close();
    process.stdout.write(`تم منح صلاحية الإدارة للحساب ${email}.\n`);
  } else {
    const password = await askPassword();
    rl.close();
    if (password.length < 12 || password.length > 128) throw new Error('كلمة المرور يجب أن تكون بين 12 و128 خانة.');
    const salt = crypto.randomBytes(16).toString('base64url');
    const passwordHash = await promisify(crypto.scrypt)(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    db.prepare("INSERT INTO users (name, email, password_salt, password_hash, role) VALUES (?, ?, ?, ?, 'admin')")
      .run(name, email, salt, Buffer.from(passwordHash).toString('base64url'));
    process.stdout.write(`تم إنشاء حساب المدير ${email}.\n`);
  }
  db.close();
})().catch((error) => { rl.close(); process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
