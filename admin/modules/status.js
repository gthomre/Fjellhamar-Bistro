/* Modul: Stengt / ferie – viser uskarp side med infoboks når restauranten holder stengt */
import { register } from "../app.js";
import { REASONS, closedNow, dateNo, esc } from "../render.js";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

register({
  id: "status",
  title: "Stengt / ferie",
  order: 10,
  keys: ["status"],
  intro: "Når dere holder stengt, blir nettsiden uskarp med en tydelig melding til gjestene. Med en «åpner igjen»-dato skrur siden seg på igjen av seg selv.",
  icon: '<path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/><circle cx="12" cy="12" r="4"/>',
  badge: (d) => (d.status && closedNow(d, today()) ? "Stengt" : ""),
  validate(d) {
    const s = d.status;
    if (s.from && s.until && s.until <= s.from) return "«Åpner igjen» må være etter «Stengt fra».";
    return "";
  },
  render(el, ctx) {
    const d = ctx.state.draft;
    d.status = d.status || { closed: false, reason: "ferie", message: "", from: "", until: "" };
    const s = d.status, h = ctx.el;

    const now = h("p", { class: "statusline" });
    const preview = h("div", { class: "preview" });
    const refresh = () => {
      const info = closedNow(d, today());
      if (!s.closed) { now.className = "statusline statusline--ok"; now.textContent = "Nå: nettsiden vises som normalt."; }
      else if (info) { now.className = "statusline statusline--closed"; now.textContent = "Nå: nettsiden viser stengt-meldingen" + (info.reopen ? " – åpner igjen " + info.reopen + "." : " til du skrur den av."); }
      else if (s.until && today() >= s.until) { now.className = "statusline statusline--ok"; now.textContent = "Perioden er over – nettsiden vises som normalt."; }
      else { now.className = "statusline statusline--plan"; now.textContent = "Planlagt: stengt fra " + dateNo(s.from) + (s.until ? " – åpner igjen " + dateNo(s.until) : "") + "."; }
      const r = REASONS[s.reason] || REASONS.annet;
      preview.innerHTML = `<div class="preview__card"><span class="script">Fjellhamar Bistro</span><h3>${esc(r.title)}</h3><p>${esc(s.message.trim() || r.text).replace(/\n/g, "<br>")}</p>${s.until ? `<p class="preview__reopen">Vi åpner igjen <strong>${esc(dateNo(s.until))}</strong></p>` : ""}<span class="preview__btn">Ring ${esc(d.contact.phone)}</span></div>`;
      fields.classList.toggle("is-off", !s.closed);
      ctx.change();
    };

    const toggle = h("label", { class: "switchcard" },
      h("input", { type: "checkbox", role: "switch", checked: s.closed, onchange: (e) => { s.closed = e.target.checked; refresh(); } }),
      h("span", { class: "switch" }),
      h("span", {}, h("strong", {}, "Vis stengt-melding på nettsiden"), h("small", {}, "Skru av når dere åpner igjen – eller sett en dato nedenfor.")));

    const reasons = h("div", { class: "chips", role: "radiogroup", "aria-label": "Årsak" }, Object.entries(REASONS).map(([k, r]) =>
      h("label", { class: "chip" },
        h("input", { type: "radio", name: "reason", value: k, checked: s.reason === k, onchange: () => { s.reason = k; msg.placeholder = r.text; refresh(); } }),
        h("span", {}, r.title))));

    const msg = h("textarea", { rows: 3, maxlength: 1000, placeholder: (REASONS[s.reason] || REASONS.annet).text, oninput: (e) => { s.message = e.target.value; refresh(); } });
    msg.value = s.message;

    const date = (key, label, hint) => h("div", { class: "field" },
      h("label", { for: "st-" + key }, label),
      h("input", { id: "st-" + key, type: "date", value: s[key], oninput: (e) => { s[key] = e.target.value; refresh(); } }),
      h("small", {}, hint));

    const fields = h("div", { class: "group" },
      h("div", { class: "field" }, h("span", { class: "label" }, "Årsak"), reasons),
      h("div", { class: "field" }, h("label", {}, "Melding til gjestene ", h("span", { class: "opt" }, "(valgfritt)")), msg, h("small", {}, "La stå tomt for å bruke standardteksten som vises i feltet.")),
      h("div", { class: "row2" },
        date("from", "Stengt fra (valgfritt)", "Tomt = stengt med en gang."),
        date("until", "Åpner igjen (valgfritt)", "Siden åpner seg selv denne dagen.")));

    el.append(now, toggle, fields, h("h2", { class: "sub" }, "Slik ser gjestene det"), preview);
    refresh();
  },
});
