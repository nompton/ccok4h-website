// GET /api/export?key=YOUR_ADMIN_KEY           -> downloads a CSV of all signups
// GET /api/export?key=YOUR_ADMIN_KEY&format=json -> returns JSON (used by /admin.html)
// Requires env vars: ADMIN_KEY (a secret you choose) and a D1 binding named "DB".

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.DB) return new Response("Storage isn't set up yet.", { status: 500 });

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first TEXT, last TEXT, email TEXT, phone TEXT,
      connection TEXT, interests TEXT, monthly INTEGER, amount TEXT, created TEXT
    )`
  ).run();

  const { results } = await env.DB.prepare("SELECT * FROM signups ORDER BY id DESC").all();
  const rows = results || [];

  if (url.searchParams.get("format") === "json") {
    return new Response(JSON.stringify(rows), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const cols = ["id", "first", "last", "email", "phone", "connection", "interests", "monthly", "amount", "created"];
  const head = ["ID", "First", "Last", "Email", "Phone", "Connection", "Interested in", "Monthly", "Amount", "Signed up"];
  const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const lines = [head.map(q).join(",")];
  for (const r of rows) {
    lines.push(cols.map((c) => q(c === "monthly" ? (r.monthly ? "Yes" : "No") : r[c])).join(","));
  }
  const csv = lines.join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ccok4h-donor-list-${stamp}.csv"`,
    },
  });
}
