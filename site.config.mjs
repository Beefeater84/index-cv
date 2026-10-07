// Canonical public URL. Override with SITE_URL when the subdomain is decided.
export const SITE = (process.env.SITE_URL ?? 'https://cv.example.com').replace(/\/$/, '');
