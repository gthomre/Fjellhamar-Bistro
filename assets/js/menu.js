/* Fjellhamar Bistro – menyside */
(function () {
  "use strict";
  var A = window.BISTRO_ALLERGENS, MENU = window.BISTRO_MENU, SPECIAL = window.BISTRO_SPECIAL;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function kr(p) { return "kr " + p + ",-"; }
  function priceHTML(it) {
    return '<span class="price"><span class="p-here">' + kr(it.p) + '</span><span class="p-ta">' +
      (it.t ? kr(it.t) + "<small>takeaway</small>" : "<em>Kun i restauranten</em>") + "</span></span>";
  }

  /* Kirsebærblomster i hero */
  var fl = $("[data-flowers]");
  if (fl) {
    var spots = [[196, 26, 1], [168, 44, 0.85], [150, 100, 1.1], [124, 72, 0.9], [96, 84, 0.75], [140, 86, 0.7], [62, 112, 0.95], [36, 128, 0.7], [182, 64, 0.6]];
    fl.innerHTML = spots.map(function (s) {
      var petals = "";
      for (var i = 0; i < 5; i++) petals += '<ellipse cx="0" cy="-9" rx="6.5" ry="9" transform="rotate(' + i * 72 + ')"/>';
      return '<g transform="translate(' + s[0] + " " + s[1] + ") scale(" + s[2] + ')"><g fill="#f6b9c4" stroke="#e8899b" stroke-width=".8">' + petals + '</g><circle r="3.4" fill="#c2185b"/><g stroke="#8e1440" stroke-width="1"><path d="M0 0l0-6M0 0l5 3M0 0l-5 3"/></g></g>';
    }).join("");
  }

  /* Spesialkombo */
  var sp = $("[data-special]");
  if (sp && SPECIAL) {
    sp.innerHTML =
      '<div class="photo"><img src="assets/img/' + SPECIAL.img + '-800.webp" alt="Bistro spesial kombo B: vårrull, tempura scampi og biff chopsuey" loading="lazy" width="800" height="450">' +
      '<div class="price-badge"><div><small><span class="p-here">Per person</span><span class="p-ta">Takeaway</span></small><strong><span class="p-here">' + SPECIAL.price + ',-</span><span class="p-ta">' + SPECIAL.takeaway + ',-</span></strong></div></div></div>' +
      '<div class="body"><span class="script">Bistro</span><h3>Spesial kombo</h3>' +
      SPECIAL.options.map(function (o) {
        return '<div class="special-option menu-item-lite" data-a="' + o.a.join(",") + '"><h4><b>' + o.key + ")</b>" + esc(o.no) + window.BISTRO_BADGES(o) + "</h4><p>" + esc(o.en) + '</p><p class="allergen-line">Allergener: ' + o.a.map(function (n) { return A[n]; }).join(", ") + "</p></div>";
      }).join("") + "</div>";
  }

  /* Meny-seksjoner */
  var root = $("[data-menu]");
  function itemHTML(it) {
    var media = it.img
      ? '<button class="thumb" type="button" data-lb="' + it.img + '" data-name="' + esc(it.no) + '" data-price="' + kr(it.p) + '" data-price-ta="' + (it.t ? kr(it.t) + " (takeaway)" : "Kun i restauranten") + '" aria-label="Se bilde av ' + esc(it.no) + '"><img src="assets/img/' + it.img + '-800.webp" alt="" loading="lazy" width="800" height="450">' + (it.n ? '<span class="tag">' + esc(it.n) + "</span>" : "") + "</button>"
      : '<span class="num" aria-hidden="true">' + (it.n ? esc(it.n) : '<svg class="icon"><use href="#i-utensils"/></svg>') + "</span>";
    var chips = it.a.map(function (n) { return '<span title="' + A[n] + '">' + A[n] + "</span>"; }).join("");
    if (it.veg) chips = '<span style="background:#e3f1e3;color:#2f6b34">Vegetar</span>' + chips;
    if (it.nor) chips = '<span style="background:#e8eef7;color:#2f4a73">Norsk klassiker</span>' + chips;
    return '<li class="menu-item" data-a="' + it.a.join(",") + '">' + media +
      "<div><h4>" + (it.n && !it.img ? '<span class="sr-only">Nr. ' + esc(it.n) + " </span>" : "") + esc(it.no) + window.BISTRO_BADGES(it) + '</h4><p class="en">' + esc(it.en) + '</p><div class="allergens">' + chips + "</div></div>" +
      priceHTML(it) + "</li>";
  }
  if (root && MENU) {
    root.innerHTML = MENU.map(function (cat) {
      return '<section class="menu-section" id="' + cat.id + '" aria-labelledby="h-' + cat.id + '" data-cat><div class="wrap">' +
        '<div class="section-head"><svg class="ornament" aria-hidden="true"><use href="#i-pagoda"/></svg>' +
        '<h2 id="h-' + cat.id + '"><span class="script">' + esc(cat.script) + "</span>" + esc(cat.title) + "</h2><p>" + esc(cat.sub) + "</p></div>" +
        cat.groups.map(function (g) { return '<ul class="menu-list">' + g.items.map(itemHTML).join("") + "</ul>"; }).join("") +
        "</div></section>";
    }).join("");
  }

  /* Kategori-piller + scrollspy */
  var catNav = $("[data-cat-nav]");
  var cats = [{ id: "kombinasjonsmenyer", title: "Kombinasjonsmenyer" }].concat(MENU.map(function (c) { return { id: c.id, title: c.title }; }));
  catNav.innerHTML = cats.map(function (c) { return '<a class="cat-pill" href="#' + c.id + '">' + esc(c.title) + "</a>"; }).join("");
  var pills = $$(".cat-pill", catNav);
  var track = catNav.parentNode;
  function updArrows() {
    var max = catNav.scrollWidth - catNav.clientWidth;
    track.classList.toggle("can-prev", catNav.scrollLeft > 4);
    track.classList.toggle("can-next", catNav.scrollLeft < max - 4);
  }
  catNav.addEventListener("scroll", function () { updArrows(); if (catNav.scrollLeft > 4) track.classList.add("was-scrolled"); }, { passive: true });
  window.addEventListener("resize", updArrows);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updArrows);
  updArrows();
  [["[data-cat-prev]", -1], ["[data-cat-next]", 1]].forEach(function (b) {
    $(b[0]).addEventListener("click", function () { catNav.scrollBy({ left: b[1] * catNav.clientWidth * 0.7, behavior: "smooth" }); });
  });
  var initial = true;
  function setActive(id) {
    pills.forEach(function (p) {
      var on = p.getAttribute("href") === "#" + id;
      p.classList.toggle("is-active", on);
      if (on) {
        p.setAttribute("aria-current", "true");
        if (!initial) { var l = p.getBoundingClientRect().left - catNav.getBoundingClientRect().left + catNav.scrollLeft - 16; catNav.scrollTo({ left: l, behavior: "smooth" }); }
      }
      else p.removeAttribute("aria-current");
    });
  }
  setActive("kombinasjonsmenyer"); initial = false;
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-35% 0px -60% 0px" });
    $$("[data-cat]").forEach(function (s) { spy.observe(s); });
  }
  var nav = $(".cat-nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("is-stuck", nav.getBoundingClientRect().top <= parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) + 1); }, { passive: true });

  /* Pris-visning: spise her / takeaway (huskes, og meny.html#takeaway åpner rett i takeaway) */
  var MODE_KEY = "fb-price-mode", modeBtns = $$("[data-mode]"), modeNote = $("[data-mode-note]"), SITE = window.BISTRO_SITE || {}, TA = SITE.takeaway || {}, PH = SITE.contact || {};
  function setMode(m, save) {
    document.documentElement.classList.toggle("mode-ta", m === "ta");
    modeBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === m)); });
    if (modeNote) modeNote.innerHTML = m === "ta"
      ? "<strong>Takeaway:</strong> " + esc(TA.hours || "") + " · " + esc(TA.last || "") + ' · <a href="tel:' + esc(PH.tel || "") + '">Ring ' + esc(PH.phone || "") + "</a>"
      : "Priser ved servering i restauranten.";
    if (save) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }
  }
  var startMode = "here";
  try { startMode = localStorage.getItem(MODE_KEY) || "here"; } catch (e) {}
  if (location.hash === "#takeaway") startMode = "ta";
  setMode(startMode === "ta" ? "ta" : "here", false);
  modeBtns.forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode"), true); }); });

  /* Allergenfilter */
  var FILTERS = [14, 1, 6, 2, 7, 4, 5, 3, 10];
  var active = {};
  var toggles = $("[data-allergen-toggles]"), reset = $("[data-allergen-reset]"), count = $("[data-allergen-count]");
  toggles.innerHTML = FILTERS.map(function (n) { return '<button class="allergen-toggle" type="button" aria-pressed="false" data-n="' + n + '">' + A[n] + "</button>"; }).join("");
  function applyFilter() {
    var keys = Object.keys(active).filter(function (k) { return active[k]; });
    var items = $$(".menu-item, .menu-item-lite"), hidden = 0;
    items.forEach(function (el) {
      var a = (el.getAttribute("data-a") || "").split(",").filter(Boolean);
      var hit = keys.some(function (k) { return a.indexOf(k) > -1; });
      el.classList.toggle("is-filtered", hit);
      if (el.classList.contains("menu-item-lite")) el.style.opacity = hit ? ".3" : "";
      if (hit) hidden++;
    });
    reset.hidden = !keys.length;
    count.textContent = keys.length ? (items.length - hidden) + " av " + items.length + " retter passer" : "";
  }
  toggles.addEventListener("click", function (e) {
    var b = e.target.closest(".allergen-toggle"); if (!b) return;
    var n = b.getAttribute("data-n"); active[n] = !active[n];
    b.setAttribute("aria-pressed", String(!!active[n])); applyFilter();
  });
  reset.addEventListener("click", function () { active = {}; $$(".allergen-toggle").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); applyFilter(); });

  /* Allergenliste */
  var legend = $("[data-legend]");
  legend.innerHTML = Object.keys(A).map(function (k) { return "<li>" + A[k] + "</li>"; }).join("");

  /* Lightbox */
  var lb = $("[data-lightbox]");
  if (lb && typeof lb.showModal === "function") {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-lb]"); if (!t) return;
      var img = $("img", lb);
      img.src = "assets/img/" + t.getAttribute("data-lb") + "-1600.webp";
      img.alt = t.getAttribute("data-name");
      $("[data-lb-name]", lb).textContent = t.getAttribute("data-name");
      $("[data-lb-price]", lb).textContent = t.getAttribute(document.documentElement.classList.contains("mode-ta") ? "data-price-ta" : "data-price");
      lb.showModal();
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* Hopp til riktig seksjon ved lasting med #hash (innhold er generert) */
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 60); }
})();
