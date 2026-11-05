# Fjellhamar Bistro – nettside

Statisk nettside for Fjellhamar Bistro (kinesisk, asiatisk og norsk mat), Fjellhamarveien 56 D, 1472 Fjellhamar.
Ren HTML/CSS/JS – ingen avhengigheter eller byggverktøy utover et lite Python-skript.

## Struktur

```
index.html, meny.html   Ferdige sider (generert – ikke rediger direkte)
src/                    Kildeversjon av sidene
partials/               Felles toppmeny, bunn og ikoner (header, footer, sprite)
build.py                Setter sammen src/ + partials/ -> index.html og meny.html
assets/css/style.css    All styling
assets/js/menu-data.js  Hele menyen: retter, priser, allergener
assets/js/main.js       Meny på mobil, «åpent nå», bordbestilling
assets/js/menu.js       Menysiden: kategorier, allergenfilter, bildevisning
assets/img/             Optimaliserte bilder (WebP)
assets/logo/            Logo og favicon
```

## Vanlige endringer

- **Priser og retter:** rediger `assets/js/menu-data.js` – oppdaterer både forsiden og menysiden.
- **Åpningstider:** `partials/footer.html` (visning) og `HOURS` øverst i `assets/js/main.js` (åpent nå-logikk og bestillingstider).
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
