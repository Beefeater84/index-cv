import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';
import { loadCv, projectUrl } from '../lib/content';

export const GET: APIRoute = () => {
  const urls = ['/', ...loadCv().projects.map((p) => projectUrl(p.slug))];
  const body = urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
  );
};
