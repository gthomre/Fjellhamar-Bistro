/* Fjellhamar Bistro – felles skript */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var HOURS = { 0: ["14:00", "22:00"], 1: null, 2: ["14:00", "22:30"], 3: ["14:00", "22:30"], 4: ["14:00", "22:30"], 5: ["14:00", "23:30"], 6: ["14:00", "23:30"] };
  var DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  var EMAIL = "helen.haiqiu@gmail.com";

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function toMin(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---- Header ---- */
  var header = $(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var toggle = $(".nav-toggle"), nav = $("#main-nav");
  if (toggle && nav) {
    var backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop"; backdrop.setAttribute("aria-hidden", "true");
    header.after(backdrop);
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      backdrop.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Lukk meny" : "Åpne meny");
      toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
    };
    backdrop.addEventListener("click", function () { setOpen(false); });
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---- Reveal ---- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("is-visible"); }); }

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Åpent nå (norsk tid) ---- */
  function osloNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
      return { day: day, min: (+o.hour % 24) * 60 + +o.minute };
    } catch (e) { var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
  }
  function nextOpening(day) {
    for (var i = 1; i <= 7; i++) { var d = (day + i) % 7; if (HOURS[d]) return { day: d, i: i, t: HOURS[d][0] }; }
  }
  function status() {
    var now = osloNow(), h = HOURS[now.day];
    if (h && now.min >= toMin(h[0]) && now.min < toMin(h[1])) return { open: true, label: "Åpent nå", detail: "Til kl. " + h[1] + " i dag", day: now.day };
    if (h && now.min < toMin(h[0])) return { open: false, label: "Åpner kl. " + h[0], detail: "I dag " + h[0] + " – " + h[1], day: now.day };
    var n = nextOpening(now.day);
    return { open: false, label: "Stengt nå", detail: "Åpner " + (n.i === 1 ? "i morgen" : DAYS[n.day]) + " kl. " + n.t, day: now.day };
  }
  var st = status();
  $$("[data-open-status]").forEach(function (el) {
    el.innerHTML = '<span class="status-dot' + (st.open ? "" : " closed") + '"></span><span>' + esc(st.label) + "</span>";
  });
  var lbl = $("[data-open-label]"), hrs = $("[data-open-hours]");
  if (lbl) lbl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><span class="status-dot' + (st.open ? "" : " closed") + '"></span>' + esc(st.label) + "</span>";
  if (hrs) hrs.textContent = st.detail;
  $$('.hours-list [data-day="' + st.day + '"]').forEach(function (el) { el.classList.add("today"); });

  /* ---- Kombinasjonsmenyer ---- */
  var combos = $("[data-combos]");
  if (combos && window.BISTRO_COMBOS) {
    combos.innerHTML = window.BISTRO_COMBOS.map(function (m, i) {
      return '<article class="combo-card reveal is-visible reveal-d' + i + '">' +
        '<div class="combo-top"><div><h3>' + esc(m.name) + "</h3><p>" + esc(m.min) + '</p></div>' +
        '<div class="combo-price"><small>Per person:</small><strong>kr. ' + m.price + ",-</strong></div></div>" +
        '<ul class="combo-list">' + m.courses.map(function (c) {
          return '<li><svg class="icon" aria-hidden="true"><use href="#' + c.icon + '"/></svg><div><h4' + (c.dessert ? ' class="dessert"' : "") + ">" + esc(c.no) + "</h4><p>" + esc(c.en) + '</p><p class="allergen-line">Allergener: ' + c.a.join(", ") + "</p></div></li>";
        }).join("") + "</ul></article>";
    }).join("");
  }

  /* ---- Bordbestilling ---- */
  var form = $("[data-booking]");
  if (form) {
    var date = $("#b-date", form), time = $("#b-time", form), note = $("[data-form-note]", form);
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);

    var fillTimes = function () {
      note.textContent = ""; note.classList.remove("warn");
      if (!date.value) { time.innerHTML = '<option value="">Velg dato først</option>'; return; }
      var d = new Date(date.value + "T12:00:00").getDay(), h = HOURS[d];
      if (!h) {
        time.innerHTML = '<option value="">Stengt denne dagen</option>';
        note.textContent = "Vi holder stengt på mandager – velg gjerne en annen dag."; note.classList.add("warn"); return;
      }
      var opts = ['<option value="">Velg tid</option>'];
      for (var m = toMin(h[0]); m <= toMin(h[1]) - 90; m += 30) {
        var t = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
        opts.push("<option>" + t + "</option>");
      }
      time.innerHTML = opts.join("");
    };
    date.addEventListener("change", fillTimes);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form), missing = [];
      [["navn", "navn"], ["telefon", "telefon"], ["dato", "dato"], ["tid", "tid"]].forEach(function (f) { if (!String(data.get(f[0]) || "").trim()) missing.push(f[1]); });
      if (missing.length) {
        note.textContent = "Fyll inn " + missing.join(", ") + " så er du i mål."; note.classList.add("warn");
        var first = form.querySelector('[name="' + (missing[0] === "navn" ? "navn" : missing[0]) + '"]'); if (first) first.focus();
        return;
      }
      var subject = "Bordbestilling " + data.get("dato") + " kl. " + data.get("tid") + " – " + data.get("gjester") + " pers.";
      var body = [
        "Hei Fjellhamar Bistro!", "", "Jeg ønsker å bestille bord:", "",
        "Navn: " + data.get("navn"), "Telefon: " + data.get("telefon"), "Dato: " + data.get("dato"), "Tid: " + data.get("tid"),
        "Antall gjester: " + data.get("gjester"), data.get("anledning") ? "Anledning: " + data.get("anledning") : "",
        data.get("melding") ? "\nMelding: " + data.get("melding") : "", "", "Hilsen " + data.get("navn")
      ].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      note.classList.remove("warn");
      note.textContent = "E-postprogrammet ditt åpnes med bestillingen ferdig utfylt – trykk send, så bekrefter vi så snart vi kan.";
    });
  }
})();
