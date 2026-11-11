/* Modul: Bordbestilling – alle bestillinger fra nettsiden. Bekreft eller avslå, så får gjesten e-post.
   Svarteksten fylles ut fra standardtekstene (fanen «Standardtekster») og kan endres før den sendes. */
import { register } from "../app.js";
import { dateNo } from "../render.js";

const STATUS = {
  pending: { label: "Venter svar", cls: "pending" },
  confirmed: { label: "Bekreftet", cls: "ok" },
  declined: { label: "Avslått", cls: "no" },
};
const TABS = [
  ["pending", "Venter svar"],
  ["confirmed", "Bekreftet"],
  ["declined", "Avslått"],
  ["past", "Tidligere"],
  ["texts", "Standardtekster"],
];
const PLACEHOLDERS = [["{navn}", "gjestens navn"], ["{dato}", "f.eks. «fredag 14. november»"], ["{tid}", "klokkeslett"], ["{gjester}", "antall gjester"], ["{telefon}", "restaurantens telefon"]];

let list = [], today = "", mailReady = true, loaded = false, loadError = "", lastFetch = 0;
let tab = "pending", compose = null; // compose = { id, action }
let root = null, C = null;

const fmt = (iso) => new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const guestsTxt = (g) => (g === "9+" ? "9 eller flere" : g);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dayTitle = (d) => (d === today ? "I dag – " : d === addDays(today, 1) ? "I morgen – " : "") + cap(dateNo(d));

const inTab = (b, t) => {
  const future = b.date >= today;
  if (t === "past") return !future;
  return future && b.status === t;
};
const pendingCount = () => list.filter((b) => inTab(b, "pending")).length;

function templates(state) {
  state.draft.booking = state.draft.booking || JSON.parse(JSON.stringify(state.defaults.booking));
  return state.draft.booking;
}

function fill(tpl, b, state) {
  const map = { navn: b.name, dato: dateNo(b.date), tid: b.time, gjester: guestsTxt(b.guests), telefon: state.draft.contact.phone };
  return String(tpl).replace(/\{(navn|dato|tid|gjester|telefon)\}/g, (_, k) => map[k]);
}

async function fetchList(ctx, quiet) {
  try {
    const data = await ctx.api("/bookings");
    list = data.bookings; today = data.today; mailReady = data.mailReady; loadError = ""; lastFetch = Date.now();
  } catch (e) { loadError = e.message; if (!quiet) ctx.toast(e.message, "err"); }
  loaded = true;
  ctx.redrawNav();
  // Tegn på nytt hvis listen vises og hun ikke holder på å skrive et svar
  if (ctx.isCurrent("bookings") && !compose && tab !== "texts" && root && root.isConnected) draw();
}

async function act(b, action, payload, btn) {
  if (btn) { btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = "Sender …"; }
  try {
    const res = await C.api("/bookings/" + encodeURIComponent(b.id), { method: "POST", body: JSON.stringify({ action, ...payload }) });
    list = list.map((x) => (x.id === b.id ? res.booking : x));
    compose = null;
    const nb = res.booking;
    if (nb.mail && nb.mail.ok) C.toast((nb.status === "confirmed" ? "Bekreftet" : "Avslått") + " – e-post sendt til " + nb.email + ".");
    else C.toast("Status lagret, men e-posten ble IKKE sendt. Ring gjesten.", "err");
    C.redrawNav();
    draw();
  } catch (e) {
    C.toast(e.message, "err");
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt; }
  }
}

function composer(b) {
  const h = C.el, state = C.state, t = templates(state);
  const ok = compose.action === "confirm";
  const subject = h("input", { type: "text", maxlength: 200, value: fill(ok ? t.confirmSubject : t.declineSubject, b, state), "aria-label": "Emne" });
  const text = h("textarea", { rows: 9, maxlength: 5000, "aria-label": "Tekst til gjesten" });
  text.value = fill(ok ? t.confirmText : t.declineText, b, state);
  const send = h("button", { class: "btn " + (ok ? "btn--primary" : "btn--danger"), type: "button", onclick: (e) => {
    if (!subject.value.trim() || !text.value.trim()) { C.toast("Emne og tekst må fylles ut.", "err"); return; }
    act(b, compose.action, { subject: subject.value, text: text.value }, e.currentTarget);
  } }, ok ? "Bekreft og send e-post" : "Avslå og send e-post");
  const box = h("div", { class: "bk__compose bk__compose--" + (ok ? "ok" : "no") },
    h("p", { class: "bk__compose-head" }, h("strong", {}, ok ? "Bekreft bestillingen" : "Avslå bestillingen"), h("span", {}, "Sendes til " + b.email)),
    h("div", { class: "field" }, h("label", {}, "Emne"), subject),
    h("div", { class: "field" }, h("label", {}, "Tekst"), text, h("small", {}, "Teksten er hentet fra standardtekstene – endre den gjerne for akkurat denne gjesten.")),
    !mailReady ? h("p", { class: "tip tip--warn" }, "E-post er ikke satt opp ennå, så gjesten får ikke denne meldingen. Statusen lagres likevel – ring gjesten på " + b.phone + ".") : null,
    h("div", { class: "bk__actions" }, send, h("button", { class: "btn btn--ghost", type: "button", onclick: () => { compose = null; draw(); } }, "Avbryt")));
  requestAnimationFrame(() => text.focus({ preventScroll: true }));
  return box;
}

function card(b) {
  const h = C.el, st = STATUS[b.status] || STATUS.pending;
  const open = compose && compose.id === b.id;
  const actionBtn = (action, label, cls) => h("button", { class: "btn btn--sm " + cls, type: "button", onclick: () => { compose = { id: b.id, action }; draw(); } }, label);

  const decided = b.status !== "pending" && b.decidedAt
    ? h("div", { class: "bk__decided" },
        h("span", {}, st.label + " " + fmt(b.decidedAt) + (b.decidedBy ? " av " + b.decidedBy : "")),
        b.mail && b.mail.ok
          ? h("span", { class: "bk__mail bk__mail--ok" }, "✓ E-post sendt til " + b.email)
          : h("span", { class: "bk__mail bk__mail--err" }, "⚠ E-posten ble ikke sendt" + (b.mail && b.mail.error ? " (" + b.mail.error + ")" : "") + ". Ring gjesten på " + b.phone + ".",
              h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: (e) => act(b, "resend", {}, e.currentTarget) }, "Prøv å sende på nytt")),
        b.reply ? h("details", { class: "bk__sent" }, h("summary", {}, b.mail && b.mail.ok ? "Se e-posten som ble sendt" : "Se teksten"), h("strong", {}, b.reply.subject), h("pre", {}, b.reply.text)) : null)
    : null;

  let actions = null;
  if (!open && b.date >= today) {
    if (b.status === "pending") actions = [actionBtn("confirm", "Bekreft", "btn--primary"), actionBtn("decline", "Avslå", "btn--danger")];
    else if (b.status === "confirmed") actions = [actionBtn("decline", "Avlys / avslå likevel", "btn--ghost")];
    else actions = [actionBtn("confirm", "Bekreft likevel", "btn--ghost")];
  }

  return h("article", { class: "bk bk--" + st.cls + (open ? " is-open" : ""), id: "bk-" + b.id },
    h("div", { class: "bk__top" },
      h("div", { class: "bk__time" }, b.time),
      h("div", { class: "bk__who" }, h("strong", {}, b.name), h("span", {}, guestsTxt(b.guests) + " " + (b.guests === "1" ? "gjest" : "gjester") + (b.occasion ? " · " + b.occasion : ""))),
      h("span", { class: "bk__status bk__status--" + st.cls }, st.label)),
    h("div", { class: "bk__contact" },
      h("a", { href: "tel:" + b.phone.replace(/[^\d+]/g, "") }, "☎ " + b.phone),
      h("a", { href: "mailto:" + b.email }, "✉ " + b.email)),
    b.message ? h("p", { class: "bk__msg" }, b.message) : null,
    h("p", { class: "bk__meta" }, "Mottatt " + fmt(b.created)),
    decided,
    actions ? h("div", { class: "bk__actions" }, actions) : null,
    open ? composer(b) : null);
}

function drawTexts(el) {
  const h = C.el, t = templates(C.state), def = C.state.defaults.booking;
  const block = (kind, title, hint) => {
    const sk = kind + "Subject", tk = kind + "Text";
    const subj = h("input", { type: "text", maxlength: 200, value: t[sk], oninput: (e) => { t[sk] = e.target.value; C.change(); } });
    const txt = h("textarea", { rows: 10, maxlength: 5000, oninput: (e) => { t[tk] = e.target.value; C.change(); } });
    txt.value = t[tk];
    return h("div", { class: "group" },
      h("h2", { class: "grp" }, title), h("p", { class: "muted", style: "margin:-8px 0 0" }, hint),
      h("div", { class: "field" }, h("label", {}, "Emne"), subj),
      h("div", { class: "field" }, h("label", {}, "Tekst"), txt),
      h("div", {}, h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => { t[sk] = def[sk]; t[tk] = def[tk]; C.change(); draw(); } }, "Tilbakestill til opprinnelig tekst")));
  };
  el.append(
    h("p", { class: "tip" }, "Disse tekstene fylles inn automatisk når du bekrefter eller avslår. Du kan alltid endre teksten for den enkelte gjesten før du sender. Ord i krøllparentes byttes ut: ",
      PLACEHOLDERS.map(([k, v], i) => [h("code", {}, k), " = " + v + (i < PLACEHOLDERS.length - 1 ? ", " : ".")])),
    block("confirm", "Bekreftelse", "Sendes når du trykker «Bekreft»."),
    block("decline", "Avslag", "Sendes når du trykker «Avslå»."));
}

function draw() {
  if (!root) return;
  const h = C.el;
  root.replaceChildren();

  const n = pendingCount();
  root.append(h("p", { class: "statusline " + (n ? "statusline--plan" : "statusline--ok") },
    n ? (n === 1 ? "1 bestilling venter på svar" : n + " bestillinger venter på svar") : "Ingen bestillinger venter på svar."));
  if (loaded && !mailReady) root.append(h("p", { class: "tip tip--warn" }, "E-post er ikke satt opp ennå: du kan bekrefte og avslå, men gjesten får ikke e-post automatisk. Ring gjesten inntil videre."));

  const pills = h("div", { class: "pills", role: "tablist" }, TABS.map(([id, label]) => {
    const c = id === "texts" ? 0 : list.filter((b) => inTab(b, id)).length;
    return h("button", { class: "pill", type: "button", role: "tab", "aria-selected": String(tab === id), onclick: () => { tab = id; compose = null; draw(); } },
      label + (c && id !== "past" ? " (" + c + ")" : ""));
  }));
  root.append(C.scroller(pills));

  const body = h("div", { class: "bk-body" });
  root.append(body);

  if (tab === "texts") { drawTexts(body); return; }

  body.append(h("div", { class: "bk-tools" },
    h("small", { class: "muted" }, lastFetch ? "Oppdatert kl. " + new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit" }).format(lastFetch) + " · oppdateres av seg selv hvert minutt" : ""),
    h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: (e) => { e.currentTarget.disabled = true; fetchList(C); } }, "Oppdater")));

  if (!loaded) { body.append(h("p", { class: "loading" }, "Henter bestillinger …")); return; }
  if (loadError && !list.length) { body.append(h("p", { class: "error" }, loadError)); return; }

  let items = list.filter((b) => inTab(b, tab));
  if (tab === "past") items = items.reverse();
  if (!items.length) {
    const empty = { pending: "Ingen nye bestillinger. Nye bestillinger fra nettsiden dukker opp her.", confirmed: "Ingen kommende bekreftede bestillinger.", declined: "Ingen avslåtte bestillinger fremover.", past: "Ingen tidligere bestillinger (de slettes automatisk 60 dager etter datoen)." }[tab];
    body.append(h("p", { class: "muted bk-empty" }, empty));
    return;
  }
  let lastDate = "";
  const out = h("div", { class: "bk-list" });
  for (const b of items) {
    if (b.date !== lastDate) { out.append(h("h2", { class: "bk-day" }, dayTitle(b.date))); lastDate = b.date; }
    out.append(card(b));
  }
  body.append(out);
}

register({
  id: "bookings",
  title: "Bordbestilling",
  order: 5,
  keys: ["booking"],
  intro: "Alle bordbestillinger fra nettsiden. Bekreft eller avslå – gjesten får svar på e-post med en gang.",
  icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  badge: () => { const n = pendingCount(); return n ? n + " ny" + (n > 1 ? "e" : "") : ""; },
  validate(d) {
    const t = d.booking;
    if (t && ![t.confirmSubject, t.confirmText, t.declineSubject, t.declineText].every((v) => String(v || "").trim())) return "Standardtekstene for bordbestilling kan ikke være tomme.";
    return "";
  },
  init(ctx) {
    C = ctx;
    fetchList(ctx, true);
    setInterval(() => { if (document.visibilityState === "visible") fetchList(ctx, true); }, 60_000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - lastFetch > 30_000) fetchList(ctx, true); });
  },
  render(el, ctx) {
    C = ctx; root = el;
    templates(ctx.state);
    draw();
  },
});
