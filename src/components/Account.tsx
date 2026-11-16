import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';
import ApiKeys from './ApiKeys';
import NewPasswordForm from './NewPasswordForm';

// The whole account page: the sign-in form when signed out, the keys when signed in.
export default function Account() {
  // undefined until Supabase has said whether there is a session.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // A password reset link signs the user in with this event, and they still need to choose a password.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) return <p className="muted">Accounts aren't set up on this build.</p>;
  if (session === undefined) return <p className="muted">Loading...</p>;
  if (!session) return <AuthForm />;
  if (recovering) return <NewPasswordForm onDone={() => setRecovering(false)} />;

  return (
    <>
      <p className="muted">
        Signed in as {session.user.email}.{' '}
        <button className="link-button" type="button" onClick={() => supabase!.auth.signOut()}>
          Sign out
        </button>
      </p>
      <ApiKeys />
    </>
  );
}
