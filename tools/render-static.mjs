/* Kalles av build.py: lager de statiske sidene (reserve og lokal forhåndsvisning) fra content/site.json */
import { readFileSync, writeFileSync } from "node:fs";
import { renderPage, siteScript, isValidSite } from "../worker/render.js";

const root = new URL("../", import.meta.url);
const site = JSON.parse(readFileSync(new URL("content/site.json", root), "utf8"));
if (!isValidSite(site)) { console.error("content/site.json har feil format"); process.exit(1); }

for (const name of ["index.html", "meny.html"]) {
  const tpl = readFileSync(new URL("build/templates/" + name, root), "utf8");
  writeFileSync(new URL(name, root), renderPage(tpl, site));
  console.log("bygget", name);
}
writeFileSync(new URL("assets/js/site-data.js", root), siteScript(site));
