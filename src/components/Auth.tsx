import type { FormEvent } from 'react';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setMessage('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart npm run dev.');
      setBusy(false);
      return;
    }

    try {
      const { error } =
        mode === 'signup'
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else if (mode === 'signup') {
        setMessage('Account created. Check your email if confirmation is enabled.');
      }
    } catch {
      setMessage('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Account</p>
      <h2>{mode === 'signin' ? 'Sign in' : 'Registration'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password, 6+ symbols"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      {message ? <p className="auth-message">{message}</p> : null}
      <button
        type="button"
        className="ghost-button"
        onClick={() => {
          setMessage('');
          setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
        }}
      >
        {mode === 'signin' ? 'Need an account? Register' : 'Already have an account? Sign in'}
      </button>
    </section>
  );
}
