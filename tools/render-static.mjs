/* Kalles av build.py: lager de statiske sidene og datafilene (reserve og lokal forhåndsvisning)
   fra content/site.json og content/menu.json */
import { readFileSync, writeFileSync } from "node:fs";
import { renderPage, siteScript, isValidSite } from "../worker/render.js";
import { menuScript, isValidMenu } from "../worker/menu.js";

const root = new URL("../", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const site = read("content/site.json"), menu = read("content/menu.json");
if (!isValidSite(site)) { console.error("content/site.json har feil format"); process.exit(1); }
if (!isValidMenu(menu)) { console.error("content/menu.json har feil format"); process.exit(1); }

for (const name of ["index.html", "meny.html"]) {
  const tpl = readFileSync(new URL("build/templates/" + name, root), "utf8");
  writeFileSync(new URL(name, root), renderPage(tpl, site));
  console.log("bygget", name);
}
writeFileSync(new URL("assets/js/site-data.js", root), siteScript(site));
writeFileSync(new URL("assets/js/menu-data.js", root), menuScript(menu));
