/* Fjellhamar Bistro – felles skript */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* Åpningstider og kontaktinfo kommer fra content/site.json (via assets/js/site-data.js) */
  var SITE = window.BISTRO_SITE || { hours: { week: {} }, contact: {} };
  var HOURS = SITE.hours.week;
  var KITCHEN = SITE.hours.kitchen; /* kjøkkenet stenger (alle åpne dager) */
  var DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  var EMAIL = SITE.contact.email;

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
    if (h && now.min >= toMin(h[0]) && now.min < toMin(h[1])) {
      if (now.min >= toMin(KITCHEN)) return { open: true, label: "Åpent nå", detail: "Kjøkkenet er stengt · baren åpen til " + h[1], day: now.day };
      return { open: true, label: "Åpent nå", detail: "Til kl. " + h[1] + " · kjøkken til " + KITCHEN, day: now.day };
    }
    if (h && now.min < toMin(h[0])) return { open: false, label: "Åpner kl. " + h[0], detail: "I dag " + h[0] + " – " + h[1] + " · kjøkken til " + KITCHEN, day: now.day };
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
        '<p class="combo-na">Serveres kun i restauranten</p>' +
        '<ul class="combo-list">' + m.courses.map(function (c) {
          return '<li><svg class="icon" aria-hidden="true"><use href="#' + c.icon + '"/></svg><div><h4' + (c.dessert ? ' class="dessert"' : "") + ">" + esc(c.no) + (window.BISTRO_BADGES ? window.BISTRO_BADGES(c) : "") + "</h4><p>" + esc(c.en) + '</p><p class="allergen-line">Allergener: ' + c.a.join(", ") + "</p></div></li>";
        }).join("") + "</ul></article>";
    }).join("");
  }

  /* ---- Forsidens favoritter: pris, takeaway og merker hentes fra menydataene (rettens nummer) ---- */
  if (window.BISTRO_MENU) {
    var byNo = {};
    window.BISTRO_MENU.forEach(function (c) { c.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.n) byNo[it.n] = it; }); }); });
    $$("[data-dish]").forEach(function (b) {
      var it = byNo[b.getAttribute("data-dish")]; if (!it) return;
      var s = $("strong", b); if (s) s.textContent = s.textContent.replace(/\d+/, it.p);
      if (it.t) b.insertAdjacentHTML("beforeend", '<span class="ta-tag"><span>Takeaway</span> ' + it.t + ",-</span>");
    });
    $$("[data-dish-title]").forEach(function (h) {
      var it = byNo[h.getAttribute("data-dish-title")];
      if (it && window.BISTRO_BADGES) h.insertAdjacentHTML("beforeend", window.BISTRO_BADGES(it));
    });
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
        var shut = [1, 2, 3, 4, 5, 6, 0].filter(function (x) { return !HOURS[x]; }).map(function (x) { return DAYS[x] + "er"; });
        note.textContent = "Vi holder stengt på " + (shut.length > 1 ? shut.slice(0, -1).join(", ") + " og " + shut[shut.length - 1] : shut[0]) + " – velg gjerne en annen dag."; note.classList.add("warn"); return;
      }
      var opts = ['<option value="">Velg tid</option>'];
      var last = Math.min(toMin(h[1]) - 90, toMin(KITCHEN) - 30); /* siste bord: senest 30 min før kjøkkenet stenger */
      for (var m = toMin(h[0]); m <= last; m += 30) {
        var t = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
        opts.push("<option>" + t + "</option>");
      }
      time.innerHTML = opts.join("");
    };
    date.addEventListener("change", fillTimes);

    var btn = form.querySelector('[type="submit"]'), btnHtml = btn.innerHTML;
    var mailtoFallback = function (data) {
      var subject = "Bordbestilling " + data.get("dato") + " kl. " + data.get("tid") + " – " + data.get("gjester") + " pers.";
      var body = [
        "Hei Fjellhamar Bistro!", "", "Jeg ønsker å bestille bord:", "",
        "Navn: " + data.get("navn"), "Telefon: " + data.get("telefon"), "E-post: " + data.get("epost"), "Dato: " + data.get("dato"), "Tid: " + data.get("tid"),
        "Antall gjester: " + data.get("gjester"), data.get("anledning") ? "Anledning: " + data.get("anledning") : "",
        data.get("melding") ? "\nMelding: " + data.get("melding") : "", "", "Hilsen " + data.get("navn")
      ].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      note.className = "form-note";
      note.textContent = "Vi fikk ikke sendt bestillingen direkte, så e-postprogrammet ditt åpnes med bestillingen ferdig utfylt – trykk send. Du kan også ringe oss på " + SITE.contact.phone + ".";
    };

    /* Sperre for bestilling fra utlandet: skjemaet gråes ut (Worker-en stopper det uansett) */
    var geoBlocked = false;
    var blockForm = function (msg) {
      geoBlocked = true;
      form.classList.add("is-blocked");
      form.setAttribute("aria-disabled", "true");
      $$("input, select, textarea, button", form).forEach(function (el) { el.disabled = true; });
      note.className = "form-note warn";
      note.textContent = (msg || "Bordbestilling på nett er bare tilgjengelig fra Norge.") + " Telefon: " + SITE.contact.phone + ".";
    };
    fetch("/api/booking", { headers: { accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (j) { if (j && j.allowed === false) blockForm(j.message); })
      .catch(function () {});

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (geoBlocked) return;
      var data = new FormData(form), missing = [];
      [["navn", "navn"], ["telefon", "telefon"], ["epost", "e-post"], ["dato", "dato"], ["tid", "tid"]].forEach(function (f) { if (!String(data.get(f[0]) || "").trim()) missing.push(f); });
      note.className = "form-note";
      if (missing.length) {
        note.textContent = "Fyll inn " + missing.map(function (f) { return f[1]; }).join(", ") + " så er du i mål."; note.classList.add("warn");
        var first = form.querySelector('[name="' + missing[0][0] + '"]'); if (first) first.focus();
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(data.get("epost")).trim())) {
        note.textContent = "E-postadressen ser ikke helt riktig ut – sjekk den, så sender vi bekreftelsen dit."; note.classList.add("warn");
        form.querySelector('[name="epost"]').focus(); return;
      }
      var payload = {}; data.forEach(function (v, k) { payload[k] = v; });
      btn.disabled = true; btn.textContent = "Sender …";
      fetch("/api/booking", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { res: res, j: j }; }); })
        .then(function (r) {
          if (r.res.ok && r.j.ok) {
            var email = String(data.get("epost")).trim();
            form.reset(); fillTimes();
            note.className = "form-note ok";
            note.textContent = "Takk! Vi har mottatt bestillingen din. Du får svar på e-post (" + email + ") så snart vi har sett på den.";
          } else if (r.res.status === 403 && (r.j.geo || !r.j.error)) {
            blockForm(r.j.error); /* sperret fra utlandet (også av en eventuell brannmurregel i Cloudflare) */
          } else if (r.res.status >= 400 && r.res.status < 500 && r.j.error) {
            note.className = "form-note warn"; note.textContent = r.j.error;
          } else { mailtoFallback(data); }
        })
        .catch(function () { mailtoFallback(data); })
        .then(function () { btn.innerHTML = btnHtml; if (!geoBlocked) btn.disabled = false; });
    });
  }
})();
