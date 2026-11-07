"""Setter sammen sidene: src/*.html + partials/ + content/site.json -> rotmappen, og lager dist/ for publisering."""
import html, json, pathlib, re, shutil
from urllib.parse import quote_plus

root = pathlib.Path(__file__).parent
parts = {n: (root / "partials" / f"{n}.html").read_text(encoding="utf-8") for n in ("sprite", "header", "footer")}

# ---- Innhold: kontaktinfo og åpningstider (content/site.json) ----
site = json.loads((root / "content" / "site.json").read_text(encoding="utf-8"))
c, hours = site["contact"], site["hours"]
week = {int(k): v for k, v in hours["week"].items()}
digits = re.sub(r"\D", "", c["phone"])
tel = "+" + digits if digits.startswith("47") and len(digits) > 8 else "+47" + digits
address = f'{c["street"]}, {c["postcode"]} {c["city"]}'

DAY_NO = {1: "Mandag", 2: "Tirsdag", 3: "Onsdag", 4: "Torsdag", 5: "Fredag", 6: "Lørdag", 0: "Søndag"}
DAY_EN = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 0: "Sunday"}
ORDER = [1, 2, 3, 4, 5, 6, 0]

def day_row(d):
    h = week.get(d)
    if not h:
        return f'<dt data-day="{d}">{DAY_NO[d]}:</dt><dd data-day="{d}" class="closed">Stengt</dd>'
    return f'<dt data-day="{d}">{DAY_NO[d]}:</dt><dd data-day="{d}">{h[0]} – {h[1]}</dd>'

IND = "        "
kitchen_row = f'<dt class="kitchen">Kjøkken:</dt><dd class="kitchen">stenger {hours["kitchen"]}</dd>'
hours_a = "\n".join(IND + r for r in [day_row(d) for d in ORDER[:3]] + [kitchen_row])
hours_b = "\n".join(IND + day_row(d) for d in ORDER[3:])

groups = {}  # samme tider -> dager (i rekkefølge)
for d in ORDER:
    if week.get(d):
        groups.setdefault(tuple(week[d]), []).append(DAY_EN[d])
hours_ld = ",\n".join(
    '    { "@type": "OpeningHoursSpecification", "dayOfWeek": '
    + (json.dumps(days[0]) if len(days) == 1 else json.dumps(days, separators=(",", ":")))
    + f', "opens": "{o}", "closes": "{cl}" }}'
    for (o, cl), days in groups.items()
)

esc = lambda s: html.escape(s, quote=True)
tokens = {
    "PHONE": esc(c["phone"]), "PHONE_LD": esc("+47 " + c["phone"]), "TEL": tel,
    "EMAIL": esc(c["email"]), "STREET": esc(c["street"]), "POSTCODE": esc(c["postcode"]), "CITY": esc(c["city"]),
    "ADDRESS": esc(address), "ADDRESS_Q": esc(quote_plus(address, safe=",")),
    "HOURS_A": hours_a, "HOURS_B": hours_b, "HOURS_LD": hours_ld,
}

# Data til skriptene (åpent nå, bordbestilling, takeaway) – samme kilde
js_data = dict(site, contact=dict(c, tel=tel))
(root / "assets" / "js" / "site-data.js").write_text(
    "/* Generert av build.py fra content/site.json – ikke rediger direkte */\n"
    "window.BISTRO_SITE = " + json.dumps(js_data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

# ---- Sider ----
for src in (root / "src").glob("*.html"):
    page = src.read_text(encoding="utf-8")
    page = page.replace("{{SPRITE}}", parts["sprite"]).replace("{{FOOTER}}", parts["footer"])

    def header(m):
        cur = m.group(1)
        return re.sub(r"\{\{CUR:(\w+)\}\}", lambda c: 'aria-current="page"' if c.group(1) == cur else "", parts["header"])

    page = re.sub(r"\{\{HEADER:(\w+)\}\}", header, page)
    page = re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: tokens[m.group(1)], page)
    (root / src.name).write_text(page, encoding="utf-8", newline="")
    print("bygget", src.name)

# dist/ = kun det som skal på nett
dist = root / "dist"
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()
for page in (root / "src").glob("*.html"):
    shutil.copy2(root / page.name, dist / page.name)
shutil.copytree(root / "assets", dist / "assets", ignore=shutil.ignore_patterns("*.jpg", "favicon.svg"))
print("dist/ klar for publisering")
