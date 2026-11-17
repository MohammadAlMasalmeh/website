-- Show a key's text once, in the reply to create_api_key, and never store it.
-- This undoes 20261117000000_show_full_keys: it deletes the stored text of every key.
-- The keys keep working, since the inference API looks them up by hash.

revoke select (key) on public.api_keys from authenticated;

alter table public.api_keys drop column key;

create or replace function public.create_api_key(key_name text)
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
