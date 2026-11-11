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
- **Hjemlevering (foodora):** av/på og lenke i admin → Åpningstider (`delivery` i `content/site.json`). Vises som boks på menysiden og lenke i kontaktboksen på forsiden – bevisst uten priser, siden prisene på nettsiden gjelder «takeaway – hent selv».
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

**Ny funksjon i admin:** lag `admin/modules/<navn>.js` som kaller `register({...})` (se en eksisterende modul), og legg til én `import`-linje i `admin/index.html`.
