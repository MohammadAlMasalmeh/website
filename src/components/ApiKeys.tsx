import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

// A key that was just made. Its text exists only here, in the reply to create_api_key.
interface NewKey {
  name: string;
  key: string;
}

const day = 24 * 60 * 60 * 1000;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// "2 hours ago" for the last week, then the date.
function formatAgo(value: string | null) {
  if (!value) return 'Never';
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed >= 7 * day) return formatDate(value);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase!
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at')
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setKeys(data);
  }

  useEffect(() => {
    load();
  }, []);

  function startCreating() {
    setCreated(null);
    setError('');
    setCreating(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name')).trim();
    setBusy(true);
    setError('');
    const { data, error } = await supabase!.rpc('create_api_key', { key_name: name });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCreating(false);
    setCopied(false);
    setCreated({ name, key: data });
    load();
  }

  async function handleRevoke(key: ApiKey) {
    if (!window.confirm(`Revoke "${key.name}"? Anything using it will stop working.`)) return;
    setError('');
    const { error } = await supabase!.rpc('revoke_api_key', { key_id: key.id });
    if (error) setError(error.message);
    load();
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.key);
    setCopied(true);
  }

  const empty = keys !== null && keys.length === 0;

  return (
    <section className="keys">
      <div className="keys-header">
        <h2 id="keys">API keys</h2>
        {!empty && (
          <button className="button button-solid" type="button" onClick={startCreating} disabled={creating}>
            Create key
          </button>
        )}
      </div>
      <p className="muted keys-note">Send a key as a bearer token. You see each key once, when you create it.</p>

      {created && (
        <div className="key-panel" role="status">
          <p className="key-panel-title">{created.name} key created</p>
          <p className="muted key-panel-note">Copy it now. You won't be able to see it again.</p>
          <div className="key-panel-row">
            <code className="key-secret">{created.key}</code>
            <button className="button button-solid" type="button" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="button button-quiet" type="button" onClick={() => setCreated(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {creating && (
        <form className="key-panel" onSubmit={handleCreate}>
          <label htmlFor="key-name">Key name</label>
          <div className="key-panel-row">
            <input id="key-name" type="text" name="name" required maxLength={64} placeholder="Production" autoFocus />
            <button className="button button-solid" type="submit" disabled={busy}>
              Create
            </button>
            <button className="button button-quiet" type="button" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
          <p className="muted key-panel-note">Something you'll recognize later, like where it's used.</p>
        </form>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {keys === null ? (
        !error && <p className="muted">Loading...</p>
      ) : empty ? (
        !creating && (
          <div className="keys-empty">
            <p className="muted">You don't have any keys yet.</p>
            <button className="button button-solid" type="button" onClick={startCreating}>
              Create your first key
            </button>
          </div>
        )
      ) : (
        <table className="key-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Key</th>
              <th scope="col" className="key-date">Created</th>
              <th scope="col" className="key-date">Last used</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="key-name">{key.name}</td>
                <td>
                  <code>{key.key_prefix}…</code>
                </td>
                <td className="key-date">{formatAgo(key.created_at)}</td>
                <td className="key-date">{formatAgo(key.last_used_at)}</td>
                <td className="key-actions">
                  <button className="button-quiet" type="button" onClick={() => handleRevoke(key)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
