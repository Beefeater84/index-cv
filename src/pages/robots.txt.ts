import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';

// AI crawlers are welcome: being read by agents is the point of this site.
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
