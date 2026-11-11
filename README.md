# Fjellhamar Bistro – nettside

Statisk nettside for Fjellhamar Bistro (kinesisk, asiatisk og norsk mat), Fjellhamarveien 56 D, 1472 Fjellhamar.
Ren HTML/CSS/JS + en liten Cloudflare Worker (`worker/`) som fyller inn kontaktinfo og åpningstider fra lagringen (KV). Bygges med `build.py` (krever Python og Node).

## Struktur

```
index.html, meny.html   Ferdige sider (generert – ikke rediger direkte)
src/                    Kildeversjon av sidene
partials/               Felles toppmeny, bunn og ikoner (header, footer, sprite)
build.py                Setter sammen src/ + partials/ -> index.html og meny.html
assets/css/style.css    All styling
content/site.json       Kontaktinfo og åpningstider (kilde for alt)
assets/js/site-data.js  Generert fra content/site.json – ikke rediger
content/menu.json       Hele menyen: retter, priser, allergener, kombinasjonsmenyer (kilde)
assets/js/menu-data.js  Generert fra content/menu.json – ikke rediger
assets/js/main.js       Meny på mobil, «åpent nå», bordbestilling
assets/js/menu.js       Menysiden: kategorier, allergenfilter, bildevisning
assets/img/             Optimaliserte bilder (WebP)
assets/logo/            Logo og favicon
```

## Vanlige endringer

- **Priser og retter:** endres av kunden i admin (`/admin` → Meny). Startmenyen/reserven ligger i `content/menu.json`.
- **Åpningstider, kjøkken, takeaway-tider, telefon, e-post og adresse:** `content/site.json` – ett sted, oppdaterer hele siden (bunn, toppmeny, «åpent nå», bordbestilling, Google-data). Kjør `python build.py` etterpå.
- **Tekst på sidene:** rediger `src/index.html` eller `src/meny.html`, og kjør deretter:

```powershell
python build.py
```

## Forhåndsvisning lokalt

Åpne `index.html` direkte i nettleseren, eller:

```powershell
python -m http.server 8080
```

## Publisering (Cloudflare Pages)

`build.py` lager også `dist/` med bare det som skal på nett (sidene + `assets/`).

```powershell
python build.py
npx wrangler pages deploy dist --project-name fjellhamar-bistro
```

## Admin-panel (/admin)

Kunden endrer meny og priser, åpningstider, kontaktinfo og «stengt/ferie» selv på `/admin`. Innlogging skjer med Cloudflare Access (engangskode på e-post).
Endringer lagres i Cloudflare KV (`CONTENT`) – live og forhåndsvisninger har hvert sitt lagringsområde (se `wrangler.jsonc`).
`content/site.json` er reserve/startdata hvis lagringen er tom eller utilgjengelig.

```
admin/index.html        Skall – lister modulene
admin/app.js            Kjerne: lasting, lagring, «ulagrede endringer», meldinger
admin/modules/*.js      Én fil per funksjon (status, menu, hours, contact, history)
worker/index.js         Ruter: sider, /admin, /api/admin
worker/auth.js          Sjekker Cloudflare Access-innlogging
worker/render.js        Fyller inn data i sidene (brukes av både bygg, Worker og admin)
```

### Bordbestilling

Skjemaet på forsiden sender til `/api/booking` (worker/bookings.js). Bestillingen lagres i KV (`booking:<dato>T<tid>~<id>`, slettes automatisk 60 dager etter datoen) og restauranten får varsel på e-post (adressen under Kontaktinfo).
I admin → **Bordbestilling** bekrefter eller avslår Helene; gjesten får e-post med teksten fra **Standardtekster** (kan endres før sending). Status: *Venter svar*, *Bekreftet*, *Avslått*.

E-post sendes via [Resend](https://resend.com) (worker/mail.js). Oppsett én gang:
1. Opprett konto hos Resend, legg til domenet `fjellhamarbistro.no` og legg inn DNS-postene de viser i Cloudflare.
2. Lag en API-nøkkel og legg den inn: `npx wrangler secret put RESEND_API_KEY`
3. Avsender står i `MAIL_FROM` i `wrangler.jsonc`.
Uten oppsettet virker alt annet, men admin viser tydelig at e-posten ikke ble sendt.

**Ny funksjon i admin:** lag `admin/modules/<navn>.js` som kaller `register({...})` (se en eksisterende modul), og legg til én `import`-linje i `admin/index.html`.
