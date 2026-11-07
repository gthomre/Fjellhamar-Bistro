/* Modul: Meny – retter, priser, takeaway, allergener, merker, skjul/utsolgt, rekkefølge.
   Kombinasjonsmenyer og spesialkombo: priser. */
import { register } from "../app.js";
import { ALLERGENS } from "../menu.js";

const FLAGS = [["hot", "Sterk 🌶"], ["new", "Nyhet"], ["veg", "Vegetar"], ["nor", "Norsk klassiker"]];
const COMBO_TAB = "__kombo";
let tab = "", query = "", openItem = null;

const kr = (v) => (Number.isInteger(v) ? v + ",-" : "–");
const intOrNaN = (s) => (/^\d+$/.test(String(s).trim()) ? parseInt(s, 10) : NaN);

function allItems(menu) {
  const out = [];
  menu.categories.forEach((c) => c.groups.forEach((g) => g.items.forEach((it, i) => out.push({ cat: c, list: g.items, it, i }))));
  return out;
}

register({
  id: "menu",
  title: "Meny",
  order: 15,
  keys: ["menu"],
  intro: "Endre retter og priser. Trykk på en rett for å redigere. «Vis på menyen» av = skjult (f.eks. utsolgt) – retten kan slås på igjen senere.",
  icon: '<path d="M4 3v8a3 3 0 0 0 3 3v7M7 3v6M10 3v8a3 3 0 0 1-3 3"/><path d="M17 21V3c-2 0-4 2-4 6v5h4"/>',
  badge: (d) => { const n = d.menu ? allItems(d.menu).filter((x) => x.it.off).length : 0; return n ? n + " skjult" : ""; },
  validate(d) {
    for (const { cat, it } of allItems(d.menu)) {
      const name = cat.title + (it.n ? " nr " + it.n : "") + (it.no ? " (" + it.no + ")" : "");
      if (!String(it.no || "").trim()) return cat.title + ": en rett mangler navn.";
      if (!Number.isInteger(it.p)) return name + ": prisen må være et helt tall.";
      if (it.t !== undefined && !Number.isInteger(it.t)) return name + ": takeaway-prisen må være et helt tall (eller tom).";
    }
    for (const c of d.menu.combos) if (!Number.isInteger(c.price)) return c.name + ": prisen må være et helt tall.";
    const s = d.menu.special;
    if (!Number.isInteger(s.price) || !Number.isInteger(s.takeaway)) return "Spesialkombo: prisene må være hele tall.";
    return "";
  },
  render(el, ctx) {
    const h = ctx.el, menu = ctx.state.draft.menu;
    if (!tab || (tab !== COMBO_TAB && !menu.categories.some((c) => c.id === tab))) tab = menu.categories[0].id;
    const images = [...new Set([...allItems(menu), ...allItems(ctx.state.defaults.menu)].map((x) => x.it.img).filter(Boolean))].sort();

    const search = h("input", { type: "search", placeholder: "Søk etter rett eller nummer …", value: query, "aria-label": "Søk i menyen",
      oninput: (e) => { query = e.target.value; drawList(); } });
    const pills = h("div", { class: "pills", role: "tablist" });
    const list = h("div", { class: "menu-edit" });
    el.append(h("div", { class: "menu-tools" }, search), pills, list);

    function drawPills() {
      pills.replaceChildren(...[...menu.categories.map((c) => [c.id, c.title]), [COMBO_TAB, "Kombinasjonsmenyer"]].map(([id, title]) =>
        h("button", { type: "button", class: "pill", role: "tab", "aria-selected": String(id === tab && !query), onclick: () => { tab = id; query = ""; search.value = ""; openItem = null; drawPills(); drawList(); } }, title)));
    }

    function summary(it) {
      const s = h("span", { class: "dish__sum" },
        h("span", { class: "dish__nr" }, it.n || "·"),
        h("span", { class: "dish__name" }, it.no || "(uten navn)"),
        h("span", { class: "dish__price" }, kr(it.p), it.t !== undefined ? h("small", {}, " · TA " + kr(it.t)) : h("small", {}, " · kun her")));
      const tags = h("span", { class: "dish__tags" });
      if (it.off) tags.append(h("span", { class: "tag tag--off" }, "Skjult"));
      if (it.new) tags.append(h("span", { class: "tag tag--new" }, "Nyhet"));
      if (it.hot) tags.append(h("span", { class: "tag" }, "🌶"));
      s.append(tags);
      return s;
    }

    function editor(it, list, idx, rerenderRow) {
      const set = (k, v) => { if (v === undefined || v === false || v === "") delete it[k]; else it[k] = v; rerenderRow(); ctx.change(); };
      const field = (label, input, hint) => h("div", { class: "field" }, h("label", {}, label, input), hint ? h("small", {}, hint) : null);
      const numIn = (k, req) => h("input", { type: "text", inputmode: "numeric", value: it[k] ?? "", placeholder: req ? "" : "tom = kun i restauranten",
        oninput: (e) => { const v = e.target.value.trim(); if (!req && v === "") set(k, undefined); else { it[k] = intOrNaN(v); rerenderRow(); ctx.change(); } } });

      const allergenChips = h("div", { class: "chips chips--sm" }, Object.entries(ALLERGENS).map(([n, name]) => {
        const num = Number(n);
        return h("label", { class: "chip" }, h("input", { type: "checkbox", checked: it.a.includes(num), onchange: (e) => {
          it.a = e.target.checked ? [...it.a, num] : it.a.filter((x) => x !== num); ctx.change(); } }), h("span", {}, name));
      }));
      const flagChips = h("div", { class: "chips chips--sm" }, FLAGS.map(([k, name]) =>
        h("label", { class: "chip" }, h("input", { type: "checkbox", checked: !!it[k], onchange: (e) => set(k, e.target.checked) }), h("span", {}, name))));
      const img = h("select", { onchange: (e) => set("img", e.target.value || undefined) },
        h("option", { value: "" }, "Ingen bilde"), images.map((n) => h("option", { value: n, selected: it.img === n }, n)));
      const show = h("label", { class: "switchcard switchcard--sm" },
        h("input", { type: "checkbox", role: "switch", checked: !it.off, onchange: (e) => set("off", !e.target.checked) }),
        h("span", { class: "switch" }), h("span", {}, h("strong", {}, "Vis på menyen"), h("small", {}, "Slå av hvis retten er utsolgt eller ikke serveres nå.")));

      const move = (dir) => { const j = idx + dir; if (j < 0 || j >= list.length) return; [list[idx], list[j]] = [list[j], list[idx]]; openItem = it; ctx.change(); drawList(); };
      return h("div", { class: "dish__edit" },
        show,
        h("div", { class: "row-nr" },
          field("Nr", h("input", { value: it.n, maxlength: 6, oninput: (e) => { it.n = e.target.value.trim(); rerenderRow(); ctx.change(); } })),
          field("Navn", h("input", { value: it.no, maxlength: 200, oninput: (e) => { it.no = e.target.value; rerenderRow(); ctx.change(); } }))),
        field("Beskrivelse (engelsk)", h("input", { value: it.en, maxlength: 300, oninput: (e) => { it.en = e.target.value; ctx.change(); } })),
        h("div", { class: "row2" }, field("Pris i restauranten (kr)", numIn("p", true)), field("Takeaway-pris (kr)", numIn("t", false))),
        h("div", { class: "field" }, h("span", { class: "label" }, "Allergener"), allergenChips),
        h("div", { class: "field" }, h("span", { class: "label" }, "Merker"), flagChips),
        field("Bilde", img, "Nye bilder legges inn av Thomre."),
        h("div", { class: "dish__actions" },
          h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => move(-1), disabled: idx === 0 }, "↑ Flytt opp"),
          h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => move(1), disabled: idx === list.length - 1 }, "↓ Flytt ned"),
          h("button", { type: "button", class: "btn btn--danger btn--sm", onclick: () => {
            if (!confirm("Slette «" + (it.no || "retten") + "»? (Vil du bare skjule den, slå av «Vis på menyen» i stedet.)")) return;
            list.splice(idx, 1); openItem = null; ctx.change(); drawList(); } }, "Slett")));
    }

    function dishRow(it, list, idx) {
      const det = h("details", { class: "dish" + (it.off ? " is-off" : ""), open: it === openItem });
      const sumWrap = h("summary", {});
      const rerenderRow = () => { sumWrap.replaceChildren(summary(it)); det.classList.toggle("is-off", !!it.off); };
      rerenderRow();
      det.append(sumWrap);
      det.addEventListener("toggle", () => {
        if (det.open) { openItem = it; if (!det.querySelector(".dish__edit")) det.append(editor(it, list, idx, rerenderRow)); }
        else if (openItem === it) openItem = null;
      });
      if (det.open) det.append(editor(it, list, idx, rerenderRow));
      return det;
    }

    function drawCombos() {
      const m = menu, num = (obj, k) => h("input", { type: "text", inputmode: "numeric", value: obj[k], oninput: (e) => { obj[k] = intOrNaN(e.target.value); ctx.change(); } });
      list.replaceChildren(
        h("div", { class: "group" }, h("h3", { class: "grp" }, "Kombinasjonsmenyer (per person)"),
          m.combos.map((c) => h("div", { class: "row2" },
            h("div", { class: "field" }, h("label", {}, c.name + " – pris (kr)", num(c, "price"))),
            h("div", { class: "field" }, h("label", {}, "Tekst under navnet", h("input", { value: c.min, maxlength: 120, oninput: (e) => { c.min = e.target.value; ctx.change(); } })))))),
        h("div", { class: "group" }, h("h3", { class: "grp" }, "Bistro spesial kombo"),
          h("div", { class: "row2" },
            h("div", { class: "field" }, h("label", {}, "Pris i restauranten (kr)", num(m.special, "price"))),
            h("div", { class: "field" }, h("label", {}, "Takeaway-pris (kr)", num(m.special, "takeaway"))))),
        h("p", { class: "tip" }, "Rettene i kombinasjonsmenyene endres av Thomre ved behov."));
    }

    function drawList() {
      if (!query && tab === COMBO_TAB) return drawCombos();
      const q = query.trim().toLowerCase();
      if (q) {
        const hits = allItems(menu).filter(({ it }) => it.n.toLowerCase() === q || it.no.toLowerCase().includes(q) || it.en.toLowerCase().includes(q));
        list.replaceChildren(hits.length
          ? h("div", { class: "dishes" }, hits.map(({ cat, list: l, it, i }) => h("div", {}, h("small", { class: "dish__cat" }, cat.title), dishRow(it, l, i))))
          : h("p", { class: "muted" }, "Ingen retter passer «" + query + "»."));
        return;
      }
      const cat = menu.categories.find((c) => c.id === tab);
      const items = cat.groups[0].items;
      list.replaceChildren(
        h("div", { class: "dishes" }, items.map((it, i) => dishRow(it, items, i))),
        h("button", { type: "button", class: "btn btn--ghost add", onclick: () => {
          const it = { n: "", no: "", en: "", p: 0, a: [] };
          items.push(it); openItem = it; ctx.change(); drawList();
          const inputs = list.querySelectorAll(".dish[open] input"); if (inputs[2]) inputs[2].focus();
        } }, "+ Legg til rett i " + cat.title));
    }

    drawPills(); drawList();
  },
});
