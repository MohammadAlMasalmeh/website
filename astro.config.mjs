import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  markdown: {
    rehypePlugins: [rehypeFigures],
  },
  redirects: {
    '/api': '/account/',
    '/blog/how-many-tokens-per-dollar': '/blog/thesis',
  },
});
