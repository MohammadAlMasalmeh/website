import { useState, type FormEvent } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Mode = 'sign-in' | 'sign-up' | 'reset';

const SUBMIT_LABEL: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Email me a reset link',
};

// When a provider sign-in fails, Supabase sends the browser back with the reason in the URL.
function errorFromUrl() {
  const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
  return params.get('error_description') ?? '';
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(errorFromUrl);
  const [notice, setNotice] = useState('');

  function switchTo(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function continueWith(provider: Provider) {
    setError('');
    const here = window.location.origin + window.location.pathname;
    // On success this leaves the page for the provider, which sends the browser back here signed in.
    const { error } = await supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: here } });
    if (error) setError(error.message);
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
      {mode !== 'reset' && (
        <>
          <button className="button provider-button" type="button" onClick={() => continueWith('google')}>
            <GoogleIcon />
            Continue with Google
          </button>
          <button className="button provider-button" type="button" onClick={() => continueWith('github')}>
            <GitHubIcon />
            Continue with GitHub
          </button>
          <p className="divider">or</p>
        </>
      )}
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
