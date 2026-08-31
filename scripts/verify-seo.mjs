import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { works } from "../src/lib/content.js";

const dist = path.join(process.cwd(), "dist");
const productionOrigin = "https://www.matvi.dev";

function read(relativePath) {
  const filePath = path.join(dist, ...relativePath.split("/"));
  assert.ok(fs.existsSync(filePath), `Missing generated file: ${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

const home = read("index.html");
assert.match(home, /<h1[^>]*>Artwork archive<\/h1>/);
assert.ok(home.includes(`rel="canonical" href="${productionOrigin}/"`));
assert.match(home, /"@type":"WebSite"/);
assert.match(home, /"@type":"Person"/);

for (const work of works) {
  const html = read(`works/${work.slug}/index.html`);
  assert.ok(html.includes(`<h1>${work.title}</h1>`), `Missing title for ${work.slug}`);
  assert.ok(
    html.includes(`rel="canonical" href="${productionOrigin}/works/${work.slug}"`),
    `Incorrect canonical for ${work.slug}`,
  );
  assert.ok(html.includes('"@type":"VisualArtwork"'), `Missing artwork data for ${work.slug}`);
}

const robots = read("robots.txt");
assert.match(robots, /User-agent: \*/);
assert.ok(robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`));

const sitemap = read("sitemap.xml");
for (const work of works) {
  assert.ok(
    sitemap.includes(`${productionOrigin}/works/${work.slug}`),
    `Sitemap is missing ${work.slug}`,
  );
}
assert.ok(!sitemap.includes("/contact"), "Contact should not be in the sitemap");
assert.ok(fs.existsSync(path.join(dist, "404.html")), "Missing generated 404 page");

const vercelConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));
assert.deepEqual(vercelConfig.redirects, [
  { source: "/home", destination: "/", permanent: true },
  { source: "/sculpture", destination: "/", permanent: true },
]);

console.log(`SEO verification passed for ${works.length} artwork pages.`);
