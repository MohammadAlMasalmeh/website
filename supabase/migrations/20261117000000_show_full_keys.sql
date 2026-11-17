-- Keep each key's text so its owner can see and copy it again from the account page.
-- The hash stays: the inference API still looks a key up by hashing what it was sent.
-- Keys made before this have no stored text, so the page falls back to showing their prefix.

alter table public.api_keys add column key text;

grant select (key) on public.api_keys to authenticated;

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
  insert into public.api_keys (user_id, name, key, key_prefix, key_hash)
  values (auth.uid(), btrim(key_name), secret, left(secret, 9), encode(sha256(convert_to(secret, 'utf8')), 'hex'));
  return secret;
end;
$$;
