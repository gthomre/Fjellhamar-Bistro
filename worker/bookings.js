/* Bordbestillinger
   • POST /api/booking (offentlig): gjesten sender skjemaet → lagres i KV og restauranten varsles på e-post.
   • /api/admin/bookings (innlogget): liste, bekrefte / avslå (sender e-post til gjesten), sende e-post på nytt.
   Hver bestilling lagres som egen nøkkel «booking:<dato>T<tid>~<id>» og slettes av seg selv 60 dager etter datoen. */
import { sendMail } from "./mail.js";
import { dateNo } from "./render.js";

const PREFIX = "booking:";
const KEEP_DAYS = 60;
const RATE_MAX = 6; // maks bestillinger per IP per time
export const OCCASIONS = ["Bursdag", "Jubileum", "Firmamiddag", "Annet"];
export const GUESTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9+"];
const STATUSES = ["pending", "confirmed", "declined"];
/** Land som kan bestille bord på nett (Cloudflare sitt landkode-anslag ut fra IP). */
const ALLOWED_COUNTRIES = ["NO"];
const GEO_BLOCKED_MSG = "Bordbestilling på nett er bare tilgjengelig fra Norge. Ring oss gjerne i stedet.";
/** Landet forespørselen kommer fra. Mangler det (f.eks. lokal testing), slippes den gjennom. */
const countryOf = (request) => request.cf?.country || request.headers.get("CF-IPCountry") || "";
export const bookingAllowedFrom = (request) => { const c = countryOf(request); return !c || ALLOWED_COUNTRIES.includes(c); };

const ID_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}~[a-z0-9]{8}$/;
const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + "T00:00:00Z"));
const isTime = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const isEmail = (e) => typeof e === "string" && e.length <= 120 && /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]{2,}$/.test(e);
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, " ");
const osloToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const guestsTxt = (g) => (g === "9+" ? "9 eller flere" : g);

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function newId(date, time) {
  const r = crypto.getRandomValues(new Uint8Array(8));
  return `${date}T${time}~` + Array.from(r, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

async function put(env, b) {
  const expiration = Math.floor(Date.parse(b.date + "T00:00:00Z") / 1000) + KEEP_DAYS * 86400;
  await env.CONTENT.put(PREFIX + b.id, JSON.stringify(b), { expiration, metadata: { status: b.status } });
}

/* ---------------- Offentlig: gjesten sender skjemaet ---------------- */

export async function handlePublicBooking(request, env, ctx, url, site) {
  const allowed = bookingAllowedFrom(request);
  // Skjemaet spør først om bestilling er mulig herfra (for å grå det ut)
  if (request.method === "GET") return json({ allowed, ...(allowed ? {} : { message: GEO_BLOCKED_MSG }) });
  if (request.method !== "POST") return json({ error: "Ikke støttet" }, 405);
  if (!allowed) return json({ error: GEO_BLOCKED_MSG, geo: true }, 403);
  if (!env.CONTENT) return json({ error: "Bestilling på nett er ikke tilgjengelig akkurat nå." }, 503);
  if (request.headers.get("Origin") !== url.origin) return json({ error: "Ugyldig opprinnelse" }, 403);
  const raw = await request.text();
  if (raw.length > 8000) return json({ error: "For mye tekst" }, 413);
  let f;
  try { f = JSON.parse(raw); } catch { return json({ error: "Ugyldig data" }, 400); }

  // Enkel spam-sperre: skjult felt som mennesker ikke fyller ut
  if (clean(f.firma, 100)) return json({ ok: true });

  const b = {
    name: oneLine(f.navn, 80),
    phone: oneLine(f.telefon, 30),
    email: oneLine(f.epost, 120).toLowerCase(),
    date: String(f.dato || ""),
    time: String(f.tid || ""),
    guests: String(f.gjester || ""),
    occasion: OCCASIONS.includes(f.anledning) ? f.anledning : "",
    message: clean(f.melding, 1000),
  };
  const today = osloToday();
  if (!b.name) return json({ error: "Fyll inn navn." }, 400);
  if (b.phone.replace(/\D/g, "").length < 8) return json({ error: "Telefonnummeret ser ikke riktig ut." }, 400);
  if (!isEmail(b.email)) return json({ error: "E-postadressen ser ikke riktig ut." }, 400);
  if (!isDate(b.date) || b.date < today || b.date > addDays(today, 365)) return json({ error: "Velg en gyldig dato." }, 400);
  if (!isTime(b.time)) return json({ error: "Velg et tidspunkt." }, 400);
  if (!GUESTS.includes(b.guests)) return json({ error: "Velg antall gjester." }, 400);
  const weekday = new Date(b.date + "T12:00:00Z").getUTCDay();
  if (site?.hours?.week && !site.hours.week[weekday]) return json({ error: "Vi holder stengt denne dagen – velg gjerne en annen dag." }, 400);

  // Begrens antall bestillinger fra samme sted
  const ip = request.headers.get("CF-Connecting-IP") || "ukjent";
  const rlKey = "rl:booking:" + ip;
  const count = Number(await env.CONTENT.get(rlKey)) || 0;
  if (count >= RATE_MAX) return json({ error: "Vi har mottatt mange bestillinger herfra – ring oss gjerne i stedet." }, 429);
  ctx.waitUntil(env.CONTENT.put(rlKey, String(count + 1), { expirationTtl: 3600 }));

  const booking = { id: newId(b.date, b.time), created: new Date().toISOString(), ...b, status: "pending" };
  await put(env, booking);

  // Varsel til restauranten (venter ikke på svaret)
  const to = env.BOOKING_NOTIFY || site?.contact?.email;
  if (to) {
    const lines = [
      "Ny bordbestilling fra nettsiden – svar gjesten i admin:",
      url.origin + "/admin/#bookings", "",
      "Navn: " + b.name, "Dato: " + dateNo(b.date) + " kl. " + b.time, "Antall gjester: " + guestsTxt(b.guests),
      "Telefon: " + b.phone, "E-post: " + b.email,
      b.occasion ? "Anledning: " + b.occasion : "",
      b.message ? "\nMelding:\n" + b.message : "",
    ].filter((l) => l !== "");
    ctx.waitUntil(sendMail(env, {
      to, replyTo: b.email,
      subject: `Ny bordbestilling: ${dateNo(b.date)} kl. ${b.time} – ${guestsTxt(b.guests)} pers. (${b.name})`,
      text: lines.join("\n"),
    }));
  }
  return json({ ok: true });
}

/* ---------------- Admin ---------------- */

async function listAll(env) {
  const keys = [];
  let cursor;
  do {
    const page = await env.CONTENT.list({ prefix: PREFIX, cursor });
    keys.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  const items = await Promise.all(keys.map((k) => env.CONTENT.get(k, { type: "json" }).catch(() => null)));
  return items.filter(Boolean).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** path er alt etter /api/admin/bookings */
export async function handleAdminBookings(request, env, path, data, user, site) {
  if (request.method === "GET" && path === "") return json({ bookings: await listAll(env), today: osloToday(), mailReady: Boolean(env.RESEND_API_KEY && env.MAIL_FROM) });

  const m = path.match(/^\/([^/]+)$/);
  if (request.method !== "POST" || !m) return json({ error: "Ukjent adresse" }, 404);
  const id = decodeURIComponent(m[1]);
  if (!ID_RE.test(id)) return json({ error: "Ugyldig bestilling" }, 400);
  const b = await env.CONTENT.get(PREFIX + id, { type: "json" });
  if (!b) return json({ error: "Fant ikke bestillingen – den kan være slettet." }, 404);

  const action = data.action;
  if (action === "confirm" || action === "decline") {
    const subject = oneLine(data.subject, 200), text = clean(data.text, 5000);
    if (!subject || !text) return json({ error: "Emne og tekst må fylles ut." }, 400);
    b.status = action === "confirm" ? "confirmed" : "declined";
    b.decidedAt = new Date().toISOString();
    b.decidedBy = user.email;
    b.reply = { subject, text };
  } else if (action === "resend") {
    if (!b.reply) return json({ error: "Det finnes ingen e-post å sende på nytt." }, 400);
  } else if (action === "note") {
    b.note = clean(data.note, 500);
    await put(env, b);
    return json({ ok: true, booking: b });
  } else {
    return json({ error: "Ukjent handling" }, 400);
  }
  if (!STATUSES.includes(b.status)) return json({ error: "Ugyldig status" }, 400);

  const r = await sendMail(env, { to: b.email, subject: b.reply.subject, text: b.reply.text, replyTo: site?.contact?.email });
  b.mail = { ok: r.ok, at: new Date().toISOString(), ...(r.ok ? {} : { error: r.error }) };
  await put(env, b);
  return json({ ok: true, booking: b });
}
