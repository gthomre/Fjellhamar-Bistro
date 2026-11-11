/* Admin – kjerne. Moduler registrerer seg med register({...}) og får et felles utkast (draft) å endre.
   Kjernen tar seg av lasting, «ulagrede endringer», lagring, angre og meldinger. */

const modules = [];
const $ = (s, c = document) => c.querySelector(s);

/**
 * Registrer en modul.
 * { id, title, icon (svg-sti), order, render(el, ctx), validate?(draft) -> feiltekst | "",
 *   badge?(draft) -> tekst, init?(ctx) – kjøres én gang etter innlasting (f.eks. hente egne data) }
 */
export function register(mod) { modules.push(mod); }

export const state = { saved: null, draft: null, defaults: null, history: [], me: "", source: "" };

const clone = (o) => JSON.parse(JSON.stringify(o));
const strip = (s) => { const { _meta, ...rest } = s || {}; return rest; };
const isDirty = () => JSON.stringify(strip(state.draft)) !== JSON.stringify(strip(state.saved));

export function toast(msg, kind = "ok") {
  const t = $("[data-toast]");
  t.textContent = msg; t.className = "toast is-show toast--" + kind;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = "toast"), 4200);
}

async function api(path, opts = {}) {
  const res = await fetch("/api/admin" + path, { headers: { "content-type": "application/json" }, credentials: "same-origin", ...opts });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { toast("Du må logge inn på nytt – laster siden …", "err"); setTimeout(() => location.reload(), 1500); }
  if (!res.ok) throw new Error(data.error || "Noe gikk galt (" + res.status + ")");
  return data;
}

function updateSavebar() { $("[data-savebar]").hidden = !isDirty(); }

/**
 * Gjør en rad som kan scrolles sideveis tydelig: tonet kant og piler når det finnes flere valg.
 * Returnerer innpakningen (legg den inn i siden i stedet for raden selv).
 */
export function scroller(row) {
  const wrap = document.createElement("div");
  wrap.className = "scroller";
  const btn = (dir, label, path) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "scroller__btn scroller__btn--" + dir; b.setAttribute("aria-label", label); b.tabIndex = -1;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
    b.addEventListener("click", () => row.scrollBy({ left: (dir === "prev" ? -1 : 1) * row.clientWidth * 0.7, behavior: "smooth" }));
    return b;
  };
  const update = () => {
    const max = row.scrollWidth - row.clientWidth;
    wrap.classList.toggle("can-prev", row.scrollLeft > 4);
    wrap.classList.toggle("can-next", row.scrollLeft < max - 4);
  };
  wrap.append(btn("prev", "Vis forrige", "M15 5l-7 7 7 7"), row, btn("next", "Vis flere", "M9 5l7 7-7 7"));
  row.addEventListener("scroll", update, { passive: true });
  new ResizeObserver(update).observe(row);
  new MutationObserver(update).observe(row, { childList: true });
  requestAnimationFrame(update);
  return wrap;
}

/** Scroller valgt element inn i synsfeltet i en sideveis rad (uten å flytte resten av siden). */
export function revealInRow(row, el) {
  if (!el || row.scrollWidth <= row.clientWidth) return;
  const r = el.getBoundingClientRect(), w = row.getBoundingClientRect();
  if (r.left < w.left + 40 || r.right > w.right - 40) row.scrollTo({ left: row.scrollLeft + r.left - w.left - 48, behavior: "smooth" });
}

/** Moduler kaller ctx.change() etter hver endring i utkastet. */
const ctx = {
  state,
  change() { updateSavebar(); drawNav(); },
  /** Tegner menyen på nytt (f.eks. når et merke/teller endres) */
  redrawNav() { drawNav(); },
  /** Er denne modulen den som vises nå? */
  isCurrent(id) { return current === id; },
  toast,
  api,
  scroller,
  revealInRow,
  async reload() { await load(); render(); },
  /** Små byggeklosser for skjema */
  el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    kids.flat().forEach((k) => k != null && e.append(k));
    return e;
  },
};

let current = location.hash.slice(1);

function icon(path) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ico");
  s.innerHTML = path; return s;
}

function drawNav() {
  const nav = $("[data-nav]");
  nav.replaceChildren(...modules.map((m) => {
    const a = ctx.el("a", { href: "#" + m.id, class: "nav__item", "aria-current": m.id === current ? "page" : false }, icon(m.icon), ctx.el("span", {}, m.title));
    if (m.badge) { const b = m.badge(state.draft); if (b) a.append(ctx.el("span", { class: "nav__badge" }, b)); }
    return a;
  }));
  revealInRow(nav, nav.querySelector('[aria-current="page"]'));
}

function render() {
  modules.sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!modules.find((m) => m.id === current)) current = modules[0].id;
  drawNav();
  const mod = modules.find((m) => m.id === current);
  const main = $("[data-main]");
  main.replaceChildren();
  const head = ctx.el("div", { class: "main__head" }, ctx.el("h1", {}, mod.title));
  if (mod.intro) head.append(ctx.el("p", { class: "intro" }, mod.intro));
  const body = ctx.el("div", { class: "main__body" });
  main.append(head, body);
  mod.render(body, ctx);
  updateSavebar();
}

async function load() {
  const data = await api("/content");
  state.saved = data.site; state.draft = clone(data.site);
  state.defaults = data.defaults; state.history = data.history; state.me = data.me; state.source = data.source;
  document.querySelectorAll("[data-me]").forEach((e) => (e.textContent = data.me));
}

async function save() {
  for (const m of modules) {
    const err = m.validate && m.validate(state.draft);
    if (err) { current = m.id; render(); toast(err, "err"); return; }
  }
  const changed = modules.filter((m) => m.keys && m.keys.some((k) => JSON.stringify(state.draft[k]) !== JSON.stringify(state.saved[k]))).map((m) => m.title);
  const btn = $("[data-save]"); btn.disabled = true; btn.textContent = "Lagrer …";
  try {
    const { _meta, ...site } = state.draft;
    const res = await api("/content", { method: "PUT", body: JSON.stringify({ site, note: changed.join(", ") }) });
    state.saved = res.site; state.draft = clone(res.site);
    const h = await api("/content"); state.history = h.history; state.source = h.source;
    render();
    toast("Lagret! Nettsiden er oppdatert innen ett minutt.");
  } catch (e) { toast(e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = "Lagre og publiser"; }
}

export async function start() {
  const nav = $("[data-nav]");
  const navParent = nav.parentNode;
  navParent.append(scroller(nav));
  document.addEventListener("click", (e) => { const u = $("details.user"); if (u && u.open && !u.contains(e.target)) u.open = false; });
  $("[data-save]").addEventListener("click", save);
  $("[data-discard]").addEventListener("click", () => { state.draft = clone(state.saved); render(); toast("Endringene er forkastet."); });
  window.addEventListener("hashchange", () => { current = location.hash.slice(1); render(); window.scrollTo(0, 0); });
  window.addEventListener("beforeunload", (e) => { if (state.draft && isDirty()) { e.preventDefault(); e.returnValue = ""; } });
  try {
    await load();
    for (const m of modules) if (m.init) m.init(ctx);
    render();
  }
  catch (e) { $("[data-main]").replaceChildren(ctx.el("p", { class: "error" }, e.message)); }
}
