import { getCollection } from 'astro:content';

// Drafts show up under `npm run dev` and never in a production build.
export async function getPosts() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
