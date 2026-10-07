import { defineConfig } from 'astro/config';
import { SITE } from './site.config.mjs';

export default defineConfig({
  site: SITE,
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
