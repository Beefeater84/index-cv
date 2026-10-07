import type { APIRoute } from 'astro';
import { llmsFullTxt } from '../lib/content';

export const GET: APIRoute = () => new Response(llmsFullTxt());
