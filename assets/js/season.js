/* Fjellhamar Bistro – egen side for sesongmenyen (julemeny.html). Data fra admin via menu-data.js. */
(function () {
  "use strict";
  var S = window.BISTRO_SEASON, A = window.BISTRO_ALLERGENS || {};
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var tpl = document.getElementById("tpl-season-art"), ART = tpl ? tpl.innerHTML : "";
  var media = $("[data-x-media]");

  if (!S) {
    media.classList.add("shape--art"); media.innerHTML = ART;
    $("[data-x-empty]").hidden = false;
    return;
  }

  var dineOnly = !S.items.some(function (it) { return it.t; });
  var meta = [S.period, dineOnly ? "Kun i restauranten" : ""].filter(Boolean).join(" · ");
  document.title = S.title + " – Fjellhamar Bistro";
  $("[data-x-title]").textContent = S.title;
  if (S.script) $("[data-x-script]").textContent = S.script;
  if (S.sub) $("[data-x-sub]").textContent = S.sub;
  if (meta) { var m = $("[data-x-meta]"); m.textContent = meta; m.hidden = false; }

  if (S.img) media.innerHTML = '<img src="assets/img/' + S.img + '-1600.webp" srcset="assets/img/' + S.img + "-800.webp 800w, assets/img/" + S.img + '-1600.webp 1600w" sizes="(max-width: 900px) 100vw, 55vw" alt="' + esc(S.title) + ' hos Fjellhamar Bistro" width="1600" height="900" fetchpriority="high">';
  else { media.classList.add("shape--art"); media.innerHTML = ART; }

  $("[data-x-items]").innerHTML = S.items.map(function (it) {
    var chips = it.a.map(function (n) { return "<span>" + esc(A[n] || n) + "</span>"; }).join("");
    if (it.veg) chips = '<span style="background:#e3f1e3;color:#2f6b34">Vegetar</span>' + chips;
    if (it.nor) chips = '<span style="background:#e8eef7;color:#2f4a73">Norsk klassiker</span>' + chips;
    var pic = it.img ? '<span class="thumb" style="cursor:default"><img src="assets/img/' + it.img + '-800.webp" alt="" loading="lazy" width="800" height="450"></span>'
      : '<span class="num" aria-hidden="true"><svg class="icon"><use href="#i-utensils"/></svg></span>';
    return '<li class="menu-item">' + pic + "<div><h4>" + esc(it.no) + (window.BISTRO_BADGES ? window.BISTRO_BADGES(it) : "") + "</h4>" +
      (it.d ? '<p class="desc">' + esc(it.d) + "</p>" : "") + (it.en ? '<p class="en">' + esc(it.en) + "</p>" : "") +
      '<div class="allergens">' + chips + "</div></div>" +
      '<span class="price">kr ' + it.p + ",-" + (it.t ? "<small>Takeaway kr " + it.t + ",-</small>" : "") + "</span></li>";
  }).join("");
})();
