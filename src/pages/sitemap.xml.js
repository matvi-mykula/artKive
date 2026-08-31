import { siteAudioTracks } from "../audio.js";
import { works } from "../lib/content.js";
import { tags } from "../tags.js";

export const prerender = true;

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(location, images = []) {
  const imageEntries = images
    .map(
      (image) => `
    <image:image>
      <image:loc>${escapeXml(image.url)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`,
    )
    .join("");
  return `
  <url>
    <loc>${escapeXml(location)}</loc>${imageEntries}
  </url>`;
}

export function GET({ site }) {
  const entries = [urlEntry(new URL("/", site).href)];

  for (const work of works) {
    entries.push(
      urlEntry(
        new URL(`/works/${work.slug}`, site).href,
        work.images.map((image, index) => ({
          url: new URL(image.url, site).href,
          title: `${work.title}, artwork view ${index + 1}`,
        })),
      ),
    );
  }

  for (const tag of Object.values(tags)) {
    const workCount = works.filter((work) => work.tags.includes(tag.id)).length;
    if (workCount >= 2) {
      entries.push(urlEntry(new URL(`/tags/${tag.id}`, site).href));
    }
  }

  for (const track of siteAudioTracks.filter((item) => item.vignette)) {
    entries.push(urlEntry(new URL(`/songs/${track.id}`, site).href));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.join("")}
</urlset>\n`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
