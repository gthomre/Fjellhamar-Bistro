/* Fjellhamar Bistro – menyen: kontroll av data og laging av assets/js/menu-data.js.
   Brukes av build.py (reserve), Worker-en (live fra KV) og admin. */

export const ALLERGENS = {
  1: "Skalldyr", 2: "Egg", 3: "Fisk", 4: "Peanøtter", 5: "Soya", 6: "Melk", 7: "Nøtter",
  8: "Selleri", 9: "Sennep", 10: "Sesamfrø", 11: "Sulfitter", 12: "Lupin", 13: "Bløtdyr", 14: "Gluten"
};

/* Merker på retter: hot = chili-ikon (sterk), new = «Nyhet». Kopiert uendret fra den opprinnelige menu-data.js */
const BADGES_JS = String.raw`window.BISTRO_BADGES = function (it) {
  return (it.hot ? '<svg class="chili" viewBox="0 0 24 24" role="img" aria-label="Sterk"><title>Sterk</title><path d="M15.2 7.6c1.9.6 2.6 2.6 1.7 4.7-1.8 4.3-6.6 8.3-12.2 8.9-1 .1-1.3-1.1-.4-1.5 4.2-2 6.4-5.3 7.3-9.4.5-2.3 1.8-3.3 3.6-2.7Z" fill="#c8161d"/><path d="M15.4 7.7c.1-1.9 1.1-3.5 2.9-4.4M14 7.9c.8-.9 2.3-1.1 3.6-.6" fill="none" stroke="#3d7a2c" stroke-width="1.8" stroke-linecap="round"/></svg>' : "") +
    (it.new ? '<span class="badge-new">Nyhet</span>' : "");
};`;

const str = (v, max, req) => typeof v === "string" && v.length <= max && (!req || v.trim().length > 0);
const opt = (v, test) => v === undefined || test(v);
const bool = (v) => v === undefined || typeof v === "boolean";
const price = (v) => Number.isInteger(v) && v >= 0 && v <= 100000;
const allergens = (a) => Array.isArray(a) && a.length <= 14 && a.every((n) => Number.isInteger(n) && n >= 1 && n <= 14);
const imgName = (v) => typeof v === "string" && /^[a-z0-9-]{1,60}$/.test(v);

export function isValidItem(i) {
  return !!i && str(i.n, 6) && str(i.no, 200, true) && opt(i.d, (v) => str(v, 300)) && str(i.en, 300) && price(i.p) && opt(i.t, price) && allergens(i.a) &&
    opt(i.img, imgName) && bool(i.hot) && bool(i.new) && bool(i.veg) && bool(i.nor) && bool(i.off);
}

/** Sjekker hele menyen – ugyldig meny gir reservemenyen, så siden aldri knekker. */
export function isValidMenu(m) {
  if (!m || typeof m !== "object" || !Array.isArray(m.categories) || !Array.isArray(m.combos) || !m.special) return false;
  const catsOk = m.categories.length <= 40 && m.categories.every((c) => c && /^[a-z0-9-]{1,40}$/.test(c.id) && str(c.title, 80, true) && str(c.script, 80) && str(c.sub, 200) &&
    Array.isArray(c.groups) && c.groups.length >= 1 && c.groups.every((g) => g && Array.isArray(g.items) && g.items.length <= 200 && g.items.every(isValidItem)));
  const combosOk = m.combos.length <= 10 && m.combos.every((c) => c && str(c.name, 80, true) && str(c.min, 120) && price(c.price) &&
    Array.isArray(c.courses) && c.courses.length <= 10 && c.courses.every((x) => x && str(x.icon, 30) && str(x.no, 200, true) && str(x.en, 300) && allergens(x.a) && bool(x.hot) && bool(x.dessert) && bool(x.new)));
  const s = m.special;
  const specialOk = price(s.price) && price(s.takeaway) && imgName(s.img) && Array.isArray(s.options) && s.options.length <= 6 &&
    s.options.every((o) => o && str(o.key, 4, true) && str(o.no, 300, true) && str(o.en, 300) && allergens(o.a) && bool(o.hot) && bool(o.new));
  return catsOk && combosOk && specialOk && isValidSeason(m.season);
}

/* ---------- Sesongmeny (julemeny o.l.) ----------
   Én meny som vises i en periode: bånd på forsiden + egen seksjon først på menysiden.
   «until» er siste dag den vises (til og med). Mangler den i lagret meny, brukes content/menu.json. */
const MONTH_NO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const isDate = (d) => d === "" || (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));

export function isValidSeason(s) {
  if (s === undefined) return true;
  return !!s && typeof s.on === "boolean" && str(s.title, 80, true) && str(s.script, 80) && str(s.sub, 300) &&
    isDate(s.from) && isDate(s.until) && opt(s.img, (v) => v === "" || imgName(v)) &&
    Array.isArray(s.items) && s.items.length <= 60 && s.items.every(isValidItem);
}

/** «6. november» fra 2026-11-06 */
const dayMonth = (iso) => { const [, m, d] = iso.split("-").map(Number); return d + ". " + MONTH_NO[m - 1]; };
/** «6. november – 30. desember» / «fra 6. november» / «til og med 30. desember» / "" */
export function seasonPeriod(s) {
  if (s.from && s.until) return dayMonth(s.from) + " – " + dayMonth(s.until);
  if (s.from) return "fra " + dayMonth(s.from);
  if (s.until) return "til og med " + dayMonth(s.until);
  return "";
}

/** Vises sesongmenyen i dag (YYYY-MM-DD, norsk tid)? Uten dato sjekkes bare på/av (nettleseren sjekker datoene). */
export function seasonLive(s, today) {
  if (!s || !s.on || !s.items.some((i) => !i.off)) return false;
  if (!today) return true;
  return (!s.from || today >= s.from) && (!s.until || today <= s.until);
}

/** Anker-id på menysiden: «Julemeny» -> julemeny (meny.html#julemeny) */
export function seasonId(s, categories = []) {
  const id = String(s.title).toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "sesongmeny";
  return categories.some((c) => c.id === id) || id === "kombinasjonsmenyer" || id === "allergener" ? id + "-sesong" : id;
}

const js = (v) => JSON.stringify(v).replace(/</g, "\u003c");

/* Nettleseren sjekker datoene på nytt (norsk tid), så en bufret/statisk fil aldri viser menyen utenfor perioden. */
const SEASON_JS = String.raw`window.BISTRO_SEASON = (function (s) {
  if (!s) return null;
  try { var t = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if ((s.from && t < s.from) || (s.until && t > s.until)) return null; } catch (e) {}
  return s;
})(`;

/** Innholdet til assets/js/menu-data.js. Retter merket «off» (skjult/utsolgt) tas ikke med.
    `today` (YYYY-MM-DD) gis av Worker-en, så sesongmenyen bare sendes med i perioden. */
export function menuScript(menu, today) {
  const s = menu.season;
  const season = seasonLive(s, today) ? {
    id: seasonId(s, menu.categories), title: s.title, script: s.script, sub: s.sub, img: s.img || "",
    from: s.from, until: s.until, period: seasonPeriod(s),
    items: s.items.filter((i) => !i.off).map(({ off, ...i }) => i),
  } : null;
  const categories = menu.categories.map((c) => ({
    ...c,
    groups: c.groups.map((g) => ({ ...g, items: g.items.filter((i) => !i.off).map(({ off, ...i }) => i) })),
  })).filter((c) => c.groups.some((g) => g.items.length));
  return "/* Fjellhamar Bistro – menydata. Generert fra content/menu.json / admin – ikke rediger direkte. */\n" +
    BADGES_JS + "\n" +
    "window.BISTRO_ALLERGENS = " + js(ALLERGENS) + ";\n" +
    "window.BISTRO_COMBOS = " + js(menu.combos) + ";\n" +
    "window.BISTRO_SPECIAL = " + js(menu.special) + ";\n" +
    "window.BISTRO_MENU = " + js(categories) + ";\n" +
    SEASON_JS + js(season) + ");\n";
}
