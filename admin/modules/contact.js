/* Modul: Kontaktinfo – telefon, e-post og adresse (vises i toppmeny, bunn, kart og bordbestilling) */
import { register } from "../app.js";

const FIELDS = [
  ["phone", "Telefon", "tel", "Skriv som det skal vises, f.eks. 67 90 22 09"],
  ["email", "E-post", "email", "Bordbestillinger sendes hit"],
  ["street", "Gateadresse", "text", ""],
  ["postcode", "Postnummer", "text", ""],
  ["city", "Sted", "text", ""],
];

register({
  id: "contact",
  title: "Kontaktinfo",
  order: 30,
  keys: ["contact"],
  intro: "Endres her, så oppdateres telefon, e-post og adresse overalt på nettsiden.",
  icon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  validate(d) {
    const c = d.contact;
    if (c.phone.replace(/\D/g, "").length < 8) return "Telefonnummeret ser ikke riktig ut (minst 8 siffer).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return "E-postadressen ser ikke riktig ut.";
    if (!c.street.trim() || !c.city.trim()) return "Fyll inn adresse og sted.";
    if (!/^\d{4}$/.test(c.postcode)) return "Postnummer må være fire siffer.";
    return "";
  },
  render(el, ctx) {
    const c = ctx.state.draft.contact, h = ctx.el;
    el.append(h("div", { class: "group" }, FIELDS.map(([k, label, type, hint]) => {
      const inp = h("input", { id: "c-" + k, type, maxlength: 120, value: c[k], autocomplete: "off", oninput: (e) => { c[k] = e.target.value; ctx.change(); } });
      if (k === "postcode") { inp.setAttribute("inputmode", "numeric"); inp.setAttribute("maxlength", "4"); }
      return h("div", { class: "field" }, h("label", { for: "c-" + k }, label), inp, hint ? h("small", {}, hint) : null);
    })));
  },
});
