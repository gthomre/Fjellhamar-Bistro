"""Setter sammen sidene: src/*.html + partials/ -> rotmappen, og lager dist/ for publisering."""
import pathlib, re, shutil

root = pathlib.Path(__file__).parent
parts = {n: (root / "partials" / f"{n}.html").read_text(encoding="utf-8") for n in ("sprite", "header", "footer")}

for src in (root / "src").glob("*.html"):
    html = src.read_text(encoding="utf-8")
    html = html.replace("{{SPRITE}}", parts["sprite"]).replace("{{FOOTER}}", parts["footer"])

    def header(m):
        cur = m.group(1)
        return re.sub(r"\{\{CUR:(\w+)\}\}", lambda c: 'aria-current="page"' if c.group(1) == cur else "", parts["header"])

    html = re.sub(r"\{\{HEADER:(\w+)\}\}", header, html)
    (root / src.name).write_text(html, encoding="utf-8")
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
