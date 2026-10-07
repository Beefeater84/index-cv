import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/content';

export const GET: APIRoute = () => new Response(llmsTxt());
