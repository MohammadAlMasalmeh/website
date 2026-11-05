import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  redirects: {
    '/blog/how-many-tokens-per-dollar': '/blog/thesis',
  },
});
