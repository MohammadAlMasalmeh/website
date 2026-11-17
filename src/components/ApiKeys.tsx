import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  // Null for keys made before the site started storing key text.
  key: string | null;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  // The id of the key whose Copy button was last pressed.
  const [copiedId, setCopiedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase!
      .from('api_keys')
      .select('id, name, key, key_prefix, created_at, last_used_at')
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setKeys(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get('name')).trim();
    setBusy(true);
    setError('');
    const { error } = await supabase!.rpc('create_api_key', { key_name: name });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    form.reset();
    load();
  }

  async function handleRevoke(key: ApiKey) {
    if (!window.confirm(`Revoke "${key.name}"? Anything using it will stop working.`)) return;
    setError('');
    const { error } = await supabase!.rpc('revoke_api_key', { key_id: key.id });
    if (error) setError(error.message);
    load();
  }

  async function handleCopy(key: ApiKey) {
    if (!key.key) return;
    await navigator.clipboard.writeText(key.key);
    setCopiedId(key.id);
  }

  return (
    <>
      <h2 id="keys">API keys</h2>

      {keys === null ? (
        !error && <p className="muted">Loading...</p>
      ) : keys.length === 0 ? (
        <p className="muted">No keys yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th>Last used</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>
                    <code>{key.key ?? `${key.key_prefix}...`}</code>
                  </td>
                  <td>{formatDate(key.created_at)}</td>
                  <td>{formatDate(key.last_used_at)}</td>
                  <td className="key-actions">
                    {key.key && (
                      <button className="link-button" type="button" onClick={() => handleCopy(key)}>
                        {copiedId === key.id ? 'Copied' : 'Copy'}
                      </button>
                    )}
                    <button className="link-button" type="button" onClick={() => handleRevoke(key)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="key-form" onSubmit={handleCreate}>
        <label>
          Name for a new key
          <input type="text" name="name" required maxLength={64} placeholder="Production" />
        </label>
        <button className="button" type="submit" disabled={busy}>
          Create key
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
