/* Fjellhamar Bistro – Worker
   • Sidene fylles med innhold fra KV (det kunden endrer i admin). Mangler eller feiler KV,
     brukes content/site.json fra bygget, så siden virker alltid.
   • /admin og /api/admin krever innlogging (Cloudflare Access).
   • /api/booking tar imot bordbestillinger fra skjemaet (se bookings.js).
   • Alt annet (bilder, CSS, JS) serveres direkte som statiske filer. */
import indexTpl from "../build/templates/index.html";
import menyTpl from "../build/templates/meny.html";
import siteDefaults from "../content/site.json";
import menuDefaults from "../content/menu.json";
import { renderPage, siteScript, isValidSite } from "./render.js";
import { menuScript, isValidMenu } from "./menu.js";
import { authenticate } from "./auth.js";
import { handlePublicBooking, handleAdminBookings } from "./bookings.js";

const PAGES = { "/": indexTpl, "/index": indexTpl, "/index.html": indexTpl, "/meny": menyTpl, "/meny.html": menyTpl };
const HISTORY_MAX = 20;
/** Reserve: innholdet fra bygget (content/site.json + content/menu.json) */
const defaults = { ...siteDefaults, menu: menuDefaults };
const withMenu = (s, fallback = menuDefaults) => (isValidMenu(s.menu) ? s : { ...s, menu: fallback });
const PAGE_HEADERS = { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" };

/** Dagens dato i Norge, YYYY-MM-DD */
const osloToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

async function loadSite(env, fresh = false) {
  if (!env.CONTENT) return { site: defaults, source: "default" };
  try {
    const s = await env.CONTENT.get("site", fresh ? { type: "json" } : { type: "json", cacheTtl: 60 });
    return isValidSite(s) ? { site: withMenu(s), source: "kv" } : { site: defaults, source: "default" };
  } catch (e) {
    console.error("KV-feil, bruker reservedata:", e);
    return { site: defaults, source: "default" };
  }
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

async function loadHistory(env) {
  try { return (await env.CONTENT.get("history", { type: "json" })) || []; } catch { return []; }
}

/** Lagrer nytt innhold og legger det forrige i historikken (for «angre»). */
async function saveSite(env, site, by, note) {
  const { site: prev, source } = await loadSite(env, true);
  const history = await loadHistory(env);
  if (source === "kv") history.unshift({ at: new Date().toISOString(), by: prev._meta?.by || "", note: prev._meta?.note || "", site: prev });
  const next = { ...site, _meta: { savedAt: new Date().toISOString(), by, note } };
  await env.CONTENT.put("history", JSON.stringify(history.slice(0, HISTORY_MAX)));
  await env.CONTENT.put("site", JSON.stringify(next));
  return next;
}

async function handleApi(request, env, url, user) {
  if (!env.CONTENT) return json({ error: "Lagring er ikke koblet til." }, 503);
  const path = url.pathname.replace(/^\/api\/admin/, "");

  if (request.method === "GET" && path === "/content") {
    const { site, source } = await loadSite(env, true);
    const history = (await loadHistory(env)).map((h, i) => ({ i, at: h.at, by: h.by, note: h.note }));
    return json({ site, source, history, me: user.email, defaults });
  }

  if (request.method === "GET" && path === "/bookings") return handleAdminBookings(request, env, "", {}, user);

  if (request.method !== "POST" && request.method !== "PUT") return json({ error: "Ikke støttet" }, 405);
  // Beskyttelse mot forespørsler fra andre nettsider
  if (request.headers.get("Origin") !== url.origin) return json({ error: "Ugyldig opprinnelse" }, 403);
  const body = await request.text();
  if (body.length > 200_000) return json({ error: "For mye data" }, 413);
  let data;
  try { data = JSON.parse(body); } catch { return json({ error: "Ugyldig data" }, 400); }

  if (path.startsWith("/bookings/")) {
    const { site } = await loadSite(env);
    return handleAdminBookings(request, env, path.slice("/bookings".length), data, user, site);
  }

  if (request.method === "PUT" && path === "/content") {
    const site = data.site;
    if (!isValidSite(site)) return json({ error: "Noe i skjemaet har feil format. Sjekk klokkeslett (TT:MM) og datoer." }, 400);
    if (!isValidMenu(site.menu)) return json({ error: "Noe i menyen har feil format. Sjekk at alle retter har navn og pris (hele kroner)." }, 400);
    const saved = await saveSite(env, site, user.email, String(data.note || "").slice(0, 120));
    return json({ ok: true, site: saved });
  }

  if (request.method === "POST" && path === "/restore") {
    const history = await loadHistory(env);
    const item = history[Number(data.i)];
    if (!item || !isValidSite(item.site)) return json({ error: "Fant ikke versjonen" }, 404);
    const { _meta, ...old } = item.site;
    const { site: current } = await loadSite(env, true);
    const site = withMenu(old, current.menu); // eldre versjoner uten meny beholder dagens meny
    const saved = await saveSite(env, site, user.email, "Gjenopprettet versjon fra " + item.at.slice(0, 16).replace("T", " "));
    return json({ ok: true, site: saved });
  }

  return json({ error: "Ukjent adresse" }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    const get = request.method === "GET" || request.method === "HEAD";

    // ---- Bordbestilling fra skjemaet på nettsiden (åpen for alle) ----
    if (p === "/api/booking") {
      const { site } = await loadSite(env);
      return handlePublicBooking(request, env, ctx, url, site);
    }

    // ---- Admin (krever innlogging) ----
    if (p === "/admin" || p.startsWith("/admin/") || p.startsWith("/api/admin")) {
      const user = await authenticate(request, env);
      if (user.error) {
        return p.startsWith("/api/")
          ? json({ error: user.error }, user.status)
          : new Response(`<!doctype html><meta charset="utf-8"><title>Admin</title><p style="font:18px system-ui;padding:40px">${user.error}</p>`, { status: user.status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      if (p.startsWith("/api/admin")) return handleApi(request, env, url, user);
      if (p === "/admin") return Response.redirect(url.origin + "/admin/", 302);
      const res = await env.ASSETS.fetch(request);
      const out = new Response(res.body, res);
      out.headers.set("cache-control", "no-store");
      out.headers.set("x-robots-tag", "noindex");
      return out;
    }

    // ---- Sider med innhold fra admin ----
    const tpl = PAGES[p];
    if (get && tpl) {
      const { site } = await loadSite(env);
      let html;
      try { html = renderPage(tpl, site, osloToday()); } catch (e) { html = renderPage(tpl, defaults); }
      return new Response(request.method === "HEAD" ? null : html, { headers: PAGE_HEADERS });
    }
    if (get && (p === "/assets/js/site-data.js" || p === "/assets/js/menu-data.js")) {
      const { site } = await loadSite(env);
      const { _meta, menu, ...pub } = site;
      return new Response(p.endsWith("menu-data.js") ? menuScript(menu) : siteScript(pub), { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" } });
    }
    return env.ASSETS.fetch(request);
  },
};
