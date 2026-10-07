import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';
import { indexMarkdown } from '../lib/content';

export const GET: APIRoute = () => new Response(indexMarkdown(SITE));
