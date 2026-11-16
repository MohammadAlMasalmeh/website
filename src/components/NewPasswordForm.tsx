import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

// Shown after someone follows a password reset link.
export default function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password'));
    setBusy(true);
    setError('');
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <form className="key-form" onSubmit={handleSubmit}>
      <label>
        New password
        <input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button className="button" type="submit" disabled={busy}>
        Save password
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
