/* Modul: Åpningstider, kjøkken, takeaway og hjemlevering (foodora) */
import { register } from "../app.js";
import { isHttps } from "../render.js";

const DAYS = [[1, "Mandag"], [2, "Tirsdag"], [3, "Onsdag"], [4, "Torsdag"], [5, "Fredag"], [6, "Lørdag"], [0, "Søndag"]];

register({
  id: "hours",
  title: "Åpningstider",
  order: 20,
  keys: ["hours", "takeaway", "delivery"],
  intro: "Tidene vises nederst på alle sider, i «Åpent nå», i bordbestillingen og for Google.",
  icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  validate(d) {
    for (const [n, name] of DAYS) {
      const t = d.hours.week[n];
      if (!t) continue;
      if (!t[0] || !t[1]) return name + ": fyll inn både åpner og stenger.";
      if (t[1] <= t[0]) return name + ": stengetid må være senere enn åpningstid (samme døgn).";
    }
    if (!d.hours.kitchen) return "Fyll inn når kjøkkenet stenger.";
    const dl = d.delivery;
    if (dl && dl.url.trim() && !isHttps(dl.url.trim())) return "Foodora-lenken må starte med https:// (kopier den fra nettleseren).";
    if (dl && dl.enabled && !dl.url.trim()) return "Lim inn foodora-lenken, eller slå av hjemlevering.";
    return "";
  },
  render(el, ctx) {
    const d = ctx.state.draft, h = ctx.el, week = d.hours.week;
    d.takeaway = d.takeaway || { hours: "", last: "" };
    d.delivery = d.delivery || { enabled: false, url: "" };

    const rows = DAYS.map(([n, name]) => {
      const t = week[n];
      const open = h("input", { type: "time", step: 900, value: t ? t[0] : "14:00", "aria-label": name + " åpner", oninput: (e) => { if (week[n]) { week[n][0] = e.target.value; ctx.change(); } } });
      const close = h("input", { type: "time", step: 900, value: t ? t[1] : "22:00", "aria-label": name + " stenger", oninput: (e) => { if (week[n]) { week[n][1] = e.target.value; ctx.change(); } } });
      const times = h("div", { class: "times" }, open, h("span", {}, "–"), close);
      const sw = h("input", { type: "checkbox", role: "switch", checked: !!t, "aria-label": name + " åpent",
        onchange: (e) => { week[n] = e.target.checked ? [open.value, close.value] : null; row.classList.toggle("is-closed", !e.target.checked); ctx.change(); } });
      const row = h("div", { class: "dayrow" + (t ? "" : " is-closed") },
        h("strong", {}, name),
        h("label", { class: "mini-switch" }, sw, h("span", { class: "switch" }), h("span", { class: "state" })),
        times, h("span", { class: "closedtxt" }, "Stengt"));
      return row;
    });

    const kitchen = h("input", { id: "h-kitchen", type: "time", step: 900, value: d.hours.kitchen, oninput: (e) => { d.hours.kitchen = e.target.value; ctx.change(); } });
    const taHours = h("input", { id: "h-ta", maxlength: 200, value: d.takeaway.hours, oninput: (e) => { d.takeaway.hours = e.target.value; ctx.change(); } });
    const taLast = h("input", { id: "h-ta-last", maxlength: 200, value: d.takeaway.last, oninput: (e) => { d.takeaway.last = e.target.value; ctx.change(); } });

    const dlUrl = h("input", { id: "h-dl-url", type: "url", maxlength: 300, placeholder: "https://www.foodora.no/restaurant/…", value: d.delivery.url, autocomplete: "off",
      oninput: (e) => { d.delivery.url = e.target.value.trim(); ctx.change(); } });
    const dlSwitch = h("label", { class: "switchcard" },
      h("input", { type: "checkbox", role: "switch", checked: d.delivery.enabled, onchange: (e) => { d.delivery.enabled = e.target.checked; ctx.change(); } }),
      h("span", { class: "switch" }),
      h("span", {}, h("strong", {}, "Vis «Levering hjem via foodora»"), h("small", {}, "Lenke øverst på forsiden, boks på menysiden og lenke ved kontaktinfo. Ingen priser vises ved lenken.")));

    el.append(
      h("div", { class: "group" }, rows),
      h("div", { class: "group" },
        h("div", { class: "field" }, h("label", { for: "h-kitchen" }, "Kjøkkenet stenger"), kitchen, h("small", {}, "Gjelder alle åpne dager. Siste bordbestilling er 30 min før."))),
      h("h2", { class: "sub" }, "Takeaway"),
      h("div", { class: "group" },
        h("div", { class: "field" }, h("label", { for: "h-ta" }, "Takeaway-tider"), taHours, h("small", {}, "Vises på menysiden. Eksempel: Tirsdag–søndag 14:00–21:30")),
        h("div", { class: "field" }, h("label", { for: "h-ta-last" }, "Siste bestilling"), taLast)),
      h("h2", { class: "sub" }, "Hjemlevering (foodora)"),
      h("div", { class: "group" }, dlSwitch,
        h("div", { class: "field" }, h("label", { for: "h-dl-url" }, "Lenke til restauranten på foodora"), dlUrl, h("small", {}, "Åpne restauranten på foodora.no og kopier adressen fra nettleseren."))),
      h("p", { class: "tip" }, "Skal dere holde stengt noen dager (ferie, helligdager, sykdom)? Bruk «Stengt / ferie» i stedet for å endre ukeplanen.")
    );
  },
});
