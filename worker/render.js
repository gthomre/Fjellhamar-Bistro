/* Fjellhamar Bistro – fyller inn kontaktinfo, åpningstider og «stengt»-melding i sidene.
   Brukes både av build.py (statiske sider / reserve) og av Worker-en (live-data fra KV). */

const DAY_NO = { 1: "Mandag", 2: "Tirsdag", 3: "Onsdag", 4: "Torsdag", 5: "Fredag", 6: "Lørdag", 0: "Søndag" };
const DAY_EN = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 0: "Sunday" };
const MONTH_NO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const IND = "        ";

/** Stengt-årsaker: overskrift og standardtekst (kan overstyres med egen melding i admin). */
export const REASONS = {
  ferie: { title: "Vi har ferie", text: "Vi tar oss en velfortjent pause. Takk for tålmodigheten – vi gleder oss til å se deg igjen!" },
  sykdom: { title: "Stengt på grunn av sykdom", text: "På grunn av sykdom holder vi dessverre stengt. Vi beklager ulempen og håper å se deg snart." },
  oppussing: { title: "Vi pusser opp", text: "Vi gjør bistroen enda hyggeligere og holder stengt en kort periode." },
  annet: { title: "Midlertidig stengt", text: "Vi holder midlertidig stengt. Takk for forståelsen." },
};

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
const isTime = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const isDate = (d) => d === "" || (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
const shortStr = (v, max) => typeof v === "string" && v.length <= max;

/** Sjekker at innholdet har riktig form – ellers brukes reservedataene. */
export function isValidSite(s) {
  if (!s || typeof s !== "object" || !s.contact || !s.hours || !s.hours.week) return false;
  const c = s.contact;
  if (![c.phone, c.email, c.street, c.postcode, c.city].every((v) => shortStr(v, 120))) return false;
  if (!isTime(s.hours.kitchen)) return false;
  const weekOk = ORDER.every((d) => {
    const h = s.hours.week[d];
    return h === null || h === undefined || (Array.isArray(h) && h.length === 2 && h.every(isTime));
  });
  if (!weekOk) return false;
  if (s.takeaway && !(shortStr(s.takeaway.hours, 200) && shortStr(s.takeaway.last, 200))) return false;
  const st = s.status;
  if (st && !(typeof st.closed === "boolean" && st.reason in REASONS && shortStr(st.message, 1000) && isDate(st.from) && isDate(st.until))) return false;
  return true;
}

export function telOf(phone) {
  const d = String(phone).replace(/\D/g, "");
  return d.startsWith("47") && d.length > 8 ? "+" + d : "+47" + d;
}

/** «tirsdag 18. november» fra 2026-11-18 */
export function dateNo(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_NO[wd].toLowerCase() + " " + d + ". " + MONTH_NO[m - 1];
}

/** Er siden stengt i dag (norsk dato, YYYY-MM-DD)? «until» er dagen dere åpner igjen. */
export function closedNow(site, today) {
  const st = site.status;
  if (!today || !st || !st.closed) return null;
  if (st.from && today < st.from) return null;
  if (st.until && today >= st.until) return null;
  const r = REASONS[st.reason] || REASONS.annet;
  return { title: r.title, text: st.message.trim() || r.text, reopen: st.until ? dateNo(st.until) : "" };
}

function closedOverlay(site, info) {
  const c = site.contact;
  return `<div class="fb-closed" role="dialog" aria-modal="true" aria-labelledby="fb-closed-title">
  <div class="fb-closed__card">
    <img src="assets/logo/logo-128.webp" alt="" width="72" height="72">
    <p class="fb-closed__brand">Fjellhamar Bistro</p>
    <h2 id="fb-closed-title">${esc(info.title)}</h2>
    <p class="fb-closed__text">${esc(info.text).replace(/\n/g, "<br>")}</p>
    ${info.reopen ? `<p class="fb-closed__reopen">Vi åpner igjen <strong>${esc(info.reopen)}</strong></p>` : ""}
    <a class="btn btn--primary" href="tel:${telOf(c.phone)}"><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg>Ring ${esc(c.phone)}</a>
  </div>
</div>
<style>
html.is-closed, html.is-closed body { overflow: hidden; }
html.is-closed body > :not(.fb-closed) { filter: blur(8px); pointer-events: none; user-select: none; }
.fb-closed { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 20px; background: rgba(63, 11, 14, 0.35); }
.fb-closed__card { width: min(100%, 460px); background: var(--cream); border-radius: var(--radius-lg); box-shadow: 0 30px 60px -20px rgba(63, 11, 14, 0.55); padding: 36px 28px 30px; text-align: center; }
.fb-closed__card img { margin: 0 auto 10px; width: 72px; height: 72px; }
.fb-closed__brand { font-family: var(--f-script); color: var(--red); font-size: 1.7rem; margin: 0 0 6px; line-height: 1; }
.fb-closed__card h2 { font-size: clamp(1.5rem, 5vw, 1.9rem); margin-bottom: 14px; }
.fb-closed__text { color: var(--muted); margin-bottom: 16px; }
.fb-closed__reopen { background: var(--cream-2); border-radius: 12px; padding: 12px 14px; margin-bottom: 22px; }
.fb-closed__reopen strong { color: var(--red-deep); }
.fb-closed .btn { width: 100%; justify-content: center; }
</style>
`;
}

function dayRow(week, d) {
  const h = week[d];
  if (!h) return `<dt data-day="${d}">${DAY_NO[d]}:</dt><dd data-day="${d}" class="closed">Stengt</dd>`;
  return `<dt data-day="${d}">${DAY_NO[d]}:</dt><dd data-day="${d}">${h[0]} – ${h[1]}</dd>`;
}

export function tokens(site) {
  const c = site.contact, week = site.hours.week;
  const address = `${c.street}, ${c.postcode} ${c.city}`;
  const addressQ = encodeURIComponent(address).replace(/%20/g, "+").replace(/%2C/g, ",")
    .replace(/[!'()*]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());

  const kitchenRow = `<dt class="kitchen">Kjøkken:</dt><dd class="kitchen">stenger ${site.hours.kitchen}</dd>`;
  const hoursA = [...ORDER.slice(0, 3).map((d) => dayRow(week, d)), kitchenRow].map((r) => IND + r).join("\n");
  const hoursB = ORDER.slice(3).map((d) => IND + dayRow(week, d)).join("\n");

  const groups = new Map(); // samme tider -> dager i rekkefølge
  for (const d of ORDER) {
    const h = week[d];
    if (!h) continue;
    const k = h[0] + "|" + h[1];
    if (!groups.has(k)) groups.set(k, { o: h[0], c: h[1], days: [] });
    groups.get(k).days.push(DAY_EN[d]);
  }
  const hoursLd = [...groups.values()].map((g) =>
    `    { "@type": "OpeningHoursSpecification", "dayOfWeek": ${JSON.stringify(g.days.length === 1 ? g.days[0] : g.days)}, "opens": "${g.o}", "closes": "${g.c}" }`
  ).join(",\n");

  return {
    PHONE: esc(c.phone), PHONE_LD: esc("+47 " + c.phone), TEL: telOf(c.phone),
    EMAIL: esc(c.email), STREET: esc(c.street), POSTCODE: esc(c.postcode), CITY: esc(c.city),
    ADDRESS: esc(address), ADDRESS_Q: esc(addressQ),
    HOURS_A: hoursA, HOURS_B: hoursB, HOURS_LD: hoursLd,
  };
}

/** Fyller {{FELT}} i en sidemal. Med `today` (YYYY-MM-DD, norsk tid) vises «stengt»-meldingen når den gjelder. */
export function renderPage(template, site, today) {
  const t = tokens(site);
  let html = template.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in t)) throw new Error("Ukjent felt i mal: " + k);
    return t[k];
  });
  const closed = closedNow(site, today);
  if (closed) {
    html = html.replace('<html lang="nb" class="no-js">', '<html lang="nb" class="no-js is-closed">')
      .replace("</body>", closedOverlay(site, closed) + "</body>");
  }
  return html;
}

/** Innholdet til assets/js/site-data.js (leses av main.js og menu.js). */
export function siteScript(site) {
  const data = { ...site, contact: { ...site.contact, tel: telOf(site.contact.phone) } };
  return "/* Generert fra content/site.json – ikke rediger direkte */\n" +
    "window.BISTRO_SITE = " + JSON.stringify(data, null, 2).replace(/</g, "\\u003c") + ";\n";
}
