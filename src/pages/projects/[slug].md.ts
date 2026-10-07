import type { APIRoute } from 'astro';
import { SITE } from '../../../site.config.mjs';
import { loadCv, projectMarkdown } from '../../lib/content';

export function getStaticPaths() {
  return loadCv().projects.map((p) => ({ params: { slug: p.slug } }));
}

export const GET: APIRoute = ({ params }) => new Response(projectMarkdown(params.slug!, SITE));
