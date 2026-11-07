/* Modul: Historikk – se tidligere versjoner og angre */
import { register } from "../app.js";

const fmt = (iso) => new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

register({
  id: "history",
  title: "Historikk",
  order: 90,
  intro: "De 20 siste versjonene lagres. Har noe blitt feil, kan du hente tilbake en tidligere versjon.",
  icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  render(el, ctx) {
    const { state, el: h } = ctx;
    const meta = state.saved._meta;
    el.append(h("div", { class: "group" },
      h("p", { class: "current" }, state.source === "kv" && meta
        ? ["Gjeldende versjon: lagret ", h("strong", {}, fmt(meta.savedAt)), meta.by ? " av " + meta.by : "", meta.note ? " (" + meta.note + ")" : ""]
        : "Nettsiden viser fortsatt standardinnholdet – ingenting er lagret fra admin ennå.")));
    if (!state.history.length) { el.append(h("p", { class: "muted" }, "Ingen tidligere versjoner ennå.")); return; }
    el.append(h("ul", { class: "history" }, state.history.map((v) =>
      h("li", {},
        h("div", {}, h("strong", {}, fmt(v.at)), h("small", {}, [v.by, v.note].filter(Boolean).join(" · ") || "Tidligere versjon")),
        h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: async (e) => {
          if (!confirm("Hente tilbake versjonen fra " + fmt(v.at) + "? Dagens versjon legges i historikken.")) return;
          e.target.disabled = true;
          try { await ctx.api("/restore", { method: "POST", body: JSON.stringify({ i: v.i }) }); await ctx.reload(); ctx.toast("Versjonen er hentet tilbake."); }
          catch (err) { ctx.toast(err.message, "err"); e.target.disabled = false; }
        } }, "Gjenopprett")))));
  },
});
