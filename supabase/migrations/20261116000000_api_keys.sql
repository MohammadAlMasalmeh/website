-- API keys. The site never sees a key's hash, and a key's text exists only in the reply to create_api_key.
-- The inference API checks a request by hashing the key it was sent and looking the hash up with the service role.

create extension if not exists pgcrypto with schema extensions;

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 64),
  -- The first characters of the key, shown in the list so people can tell their keys apart.
  key_prefix text not null,
  -- Hex SHA-256 of the whole key.
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index api_keys_user_id_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

-- Signed-in users can read their own keys, minus the hash. Every write goes through the functions below.
revoke all on public.api_keys from anon, authenticated;
grant select (id, name, key_prefix, created_at, last_used_at, revoked_at) on public.api_keys to authenticated;

create policy "Users read their own keys" on public.api_keys
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Makes a key for the signed-in user and returns its text. This is the only time the text is available.
create function public.create_api_key(key_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text := 'slug_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null then
    raise exception 'Sign in to create a key.';
  end if;
  if (select count(*) from public.api_keys where user_id = auth.uid() and revoked_at is null) >= 20 then
    raise exception 'You have 20 keys. Revoke one before creating another.';
  end if;
  insert into public.api_keys (user_id, name, key_prefix, key_hash)
  values (auth.uid(), btrim(key_name), left(secret, 9), encode(sha256(convert_to(secret, 'utf8')), 'hex'));
  return secret;
end;
$$;

create function public.revoke_api_key(key_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.api_keys
  set revoked_at = now()
  where id = key_id and user_id = auth.uid() and revoked_at is null;
$$;

revoke execute on function public.create_api_key(text) from public, anon;
revoke execute on function public.revoke_api_key(uuid) from public, anon;
grant execute on function public.create_api_key(text) to authenticated;
grant execute on function public.revoke_api_key(uuid) to authenticated;
