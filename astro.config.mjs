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
    '/blog/how-many-tokens-per-dollar': '/blog/thesis',
  },
});
