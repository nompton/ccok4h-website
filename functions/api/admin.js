// /api/admin — organizer auth + data access, backed by D1 (binding "DB").
//
//  GET  /api/admin                          -> { configured: bool }  (is a password set yet?)
//  POST /api/admin { action:"setup",  password }   -> first-run: stores the password (hashed)
//  POST /api/admin { action:"list",   password }   -> { ok:true, rows:[...] }
//  POST /api/admin { action:"export", password }   -> CSV text (attachment)
//
// The password is never stored in plain text — only a PBKDF2 salt + hash live in the DB.

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "Storage isn't set up yet." }, 500);
  await ensureTables(env);

  if (request.method === "GET") {
    return json({ configured: await isConfigured(env) });
  }

  if (request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const action = b.action;
    const username = String(b.username || "").trim();
    const password = String(b.password || "");

    if (action === "setup") {
      // First person to set this up becomes the admin. After that, it's locked.
      if (await isConfigured(env)) return json({ error: "An admin account already exists." }, 409);
      if (!username) return json({ error: "Choose a username." }, 400);
      if (password.length < 6) return json({ error: "Use a password of at least 6 characters." }, 400);
      await setAdmin(env, username, password);
      return json({ ok: true });
    }

    // Everything else requires the admin username + password.
    if (!(await verify(env, username, password))) return json({ error: "Wrong username or password." }, 401);

    const { results } = await env.DB.prepare("SELECT * FROM signups ORDER BY id DESC").all();
    const rows = results || [];

    if (action === "export") {
      const stamp = new Date().toISOString().slice(0, 10);
      return new Response(toCSV(rows), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="ccok4h-donor-list-${stamp}.csv"`,
        },
      });
    }

    return json({ ok: true, rows });
  }

  return json({ error: "Method not allowed." }, 405);
}

async function ensureTables(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first TEXT, last TEXT, email TEXT, phone TEXT,
      connection TEXT, interests TEXT, monthly INTEGER, amount TEXT, created TEXT
    )`
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT)`
  ).run();
}

async function getSetting(env, name) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE name = ?").bind(name).first();
  return row ? row.value : null;
}
async function isConfigured(env) {
  return !!(await getSetting(env, "admin_hash"));
}
async function setAdmin(env, username, pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  const hash = await hashPw(pw, saltHex);
  await env.DB.prepare("INSERT OR REPLACE INTO settings (name, value) VALUES ('admin_user', ?)").bind(username).run();
  await env.DB.prepare("INSERT OR REPLACE INTO settings (name, value) VALUES ('admin_salt', ?)").bind(saltHex).run();
  await env.DB.prepare("INSERT OR REPLACE INTO settings (name, value) VALUES ('admin_hash', ?)").bind(hash).run();
}
async function verify(env, username, pw) {
  const storedUser = await getSetting(env, "admin_user");
  const saltHex = await getSetting(env, "admin_salt");
  const stored = await getSetting(env, "admin_hash");
  if (!storedUser || !saltHex || !stored || !username || !pw) return false;
  if (username.toLowerCase() !== storedUser.toLowerCase()) return false;
  const hash = await hashPw(pw, saltHex);
  return timingSafeEqual(hash, stored);
}

async function hashPw(pw, saltHex) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function bytesToHex(bytes) {
  return Array.from(bytes).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function toCSV(rows) {
  const cols = ["id", "first", "last", "email", "phone", "connection", "interests", "monthly", "amount", "created"];
  const head = ["ID", "First", "Last", "Email", "Phone", "Connection", "Interested in", "Monthly", "Amount", "Signed up"];
  const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const lines = [head.map(q).join(",")];
  for (const r of rows) lines.push(cols.map((c) => q(c === "monthly" ? (r.monthly ? "Yes" : "No") : r[c])).join(","));
  return lines.join("\r\n");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
