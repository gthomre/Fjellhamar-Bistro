"""Setter sammen sidene: src/*.html + partials/ -> maler i build/templates/,
fyller inn content/site.json (via worker/render.js) -> index.html og meny.html, og lager dist/ for publisering.
Krever Python og Node."""
import pathlib, re, shutil, subprocess, sys

root = pathlib.Path(__file__).parent
parts = {n: (root / "partials" / f"{n}.html").read_text(encoding="utf-8") for n in ("sprite", "header", "footer")}

# 1) Maler (med {{FELT}} for kontaktinfo og åpningstider) – brukes også av Worker-en
tpl_dir = root / "build" / "templates"
tpl_dir.mkdir(parents=True, exist_ok=True)
for src in (root / "src").glob("*.html"):
    html = src.read_text(encoding="utf-8")
    html = html.replace("{{SPRITE}}", parts["sprite"]).replace("{{FOOTER}}", parts["footer"])

    def header(m):
        cur = m.group(1)
        return re.sub(r"\{\{CUR:(\w+)\}\}", lambda c: 'aria-current="page"' if c.group(1) == cur else "", parts["header"])

    html = re.sub(r"\{\{HEADER:(\w+)\}\}", header, html)
    (tpl_dir / src.name).write_text(html, encoding="utf-8", newline="")

# 2) Ferdige sider + assets/js/site-data.js fra content/site.json
r = subprocess.run(["node", str(root / "tools" / "render-static.mjs")])
if r.returncode:
    sys.exit("Feil under utfylling av sidene")

# 3) dist/ = kun det som skal på nett
dist = root / "dist"
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()
for page in (root / "src").glob("*.html"):
    shutil.copy2(root / page.name, dist / page.name)
shutil.copytree(root / "assets", dist / "assets", ignore=shutil.ignore_patterns("*.jpg", "favicon.svg"))
# Admin-panelet (beskyttet av innlogging i Worker-en) + felles kode for visning
shutil.copytree(root / "admin", dist / "admin")
shutil.copy2(root / "worker" / "render.js", dist / "admin" / "render.js")
print("dist/ klar for publisering")
