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
  return !!i && str(i.n, 6) && str(i.no, 200, true) && str(i.en, 300) && price(i.p) && opt(i.t, price) && allergens(i.a) &&
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
  return catsOk && combosOk && specialOk;
}

const js = (v) => JSON.stringify(v).replace(/</g, "\u003c");

/** Innholdet til assets/js/menu-data.js. Retter merket «off» (skjult/utsolgt) tas ikke med. */
export function menuScript(menu) {
  const categories = menu.categories.map((c) => ({
    ...c,
    groups: c.groups.map((g) => ({ ...g, items: g.items.filter((i) => !i.off).map(({ off, ...i }) => i) })),
  })).filter((c) => c.groups.some((g) => g.items.length));
  return "/* Fjellhamar Bistro – menydata. Generert fra content/menu.json / admin – ikke rediger direkte. */\n" +
    BADGES_JS + "\n" +
    "window.BISTRO_ALLERGENS = " + js(ALLERGENS) + ";\n" +
    "window.BISTRO_COMBOS = " + js(menu.combos) + ";\n" +
    "window.BISTRO_SPECIAL = " + js(menu.special) + ";\n" +
    "window.BISTRO_MENU = " + js(categories) + ";\n";
}
