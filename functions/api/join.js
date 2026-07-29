// POST /api/join — stores a donor-list signup in the D1 database.
// Requires a D1 binding named "DB" on the Pages project.

export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return json({ error: "Bad request." }, 400);

    const b = await request.json().catch(() => ({}));

    // Honeypot: real people leave this blank; bots fill it. Silently accept & drop.
    if (b.website) return json({ ok: true });

    const first = clean(b.first, 80);
    const last = clean(b.last, 80);
    const email = clean(b.email, 160);
    if (!first || !last || !validEmail(email)) {
      return json({ error: "Please enter your name and a valid email." }, 400);
    }

    const phone = clean(b.phone, 40);
    const connection = clean(b.connection, 60);
    const interests = Array.isArray(b.interests)
      ? b.interests.map((x) => clean(x, 60)).filter(Boolean).join("; ")
      : clean(b.interests, 240);
    const club = clean(b.club, 120);
    const monthly = b.monthly ? 1 : 0;
    const amount = clean(b.amount, 20);

    if (!env.DB) return json({ error: "Storage isn't set up yet. (Add the D1 binding.)" }, 500);

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS signups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first TEXT, last TEXT, email TEXT, phone TEXT,
        connection TEXT, club TEXT, interests TEXT, monthly INTEGER, amount TEXT, created TEXT
      )`
    ).run();
    // Add the club column if this table was created before club existed.
    try { await env.DB.prepare("ALTER TABLE signups ADD COLUMN club TEXT").run(); } catch (e) {}

    await env.DB.prepare(
      `INSERT INTO signups (first, last, email, phone, connection, club, interests, monthly, amount, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(first, last, email, phone, connection, club, interests, monthly, amount, new Date().toISOString()).run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

function clean(v, max) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}
function validEmail(e) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
