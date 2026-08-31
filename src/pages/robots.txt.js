export const prerender = true;

export function GET({ site }) {
  const sitemap = new URL("sitemap.xml", site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
