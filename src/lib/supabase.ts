import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_KEY;

// Null when the env vars are missing, so the site still builds without them.
export const supabase = url && key ? createClient(url, key) : null;
