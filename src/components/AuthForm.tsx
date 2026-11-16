import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'sign-in' | 'sign-up' | 'reset';

const SUBMIT_LABEL: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Email me a reset link',
};

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function switchTo(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    // Links in the emails Supabase sends come back to this page.
    const here = window.location.origin + window.location.pathname;
    setBusy(true);
    setError('');
    setNotice('');

    const auth = supabase!.auth;
    if (mode === 'sign-in') {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === 'sign-up') {
      const { data: result, error } = await auth.signUp({ email, password, options: { emailRedirectTo: here } });
      if (error) setError(error.message);
      // No session means the project wants the address confirmed first.
      else if (!result.session) setNotice(`We sent a confirmation link to ${email}.`);
    } else {
      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: here });
      if (error) setError(error.message);
      else setNotice(`If ${email} has an account, a reset link is on its way.`);
    }
    setBusy(false);
  }

  return (
    <form className="key-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
      </label>
      {mode !== 'reset' && (
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          />
        </label>
      )}
      <button className="button" type="submit" disabled={busy}>
        {SUBMIT_LABEL[mode]}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="muted form-note" role="status">
          {notice}
        </p>
      )}
      <p className="muted form-note">
        {mode === 'sign-in' ? (
          <>
            <button className="link-button" type="button" onClick={() => switchTo('sign-up')}>
              Create an account
            </button>
            {' or '}
            <button className="link-button" type="button" onClick={() => switchTo('reset')}>
              reset your password
            </button>
            .
          </>
        ) : (
          <button className="link-button" type="button" onClick={() => switchTo('sign-in')}>
            Back to sign in
          </button>
        )}
      </p>
    </form>
  );
}
