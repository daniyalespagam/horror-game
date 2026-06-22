import type { FormEvent } from 'react';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthProps = {
  onGuest: () => void;
};

export function Auth({ onGuest }: AuthProps) {
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
      const cleanEmail = email.trim().toLowerCase();

      const { error } =
        mode === 'signup'
          ? await supabase.auth.signUp({ email: cleanEmail, password })
          : await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (error) {
        console.error('Supabase auth error:', error);
        setMessage(getFriendlyAuthError(error.message));
      } else if (mode === 'signup') {
        setMessage('Account created. If email confirmation is enabled, check your inbox.');
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
      <button type="button" className="guest-button" onClick={onGuest}>
        Continue as guest
      </button>
    </section>
  );
}

function getFriendlyAuthError(errorMessage: string) {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Wrong email or password.';
  }

  if (lowerMessage.includes('user already registered') || lowerMessage.includes('already been registered')) {
    return 'This email is already registered. Try signing in.';
  }

  if (lowerMessage.includes('signup') && lowerMessage.includes('disabled')) {
    return 'Registration is disabled in Supabase settings.';
  }

  if (lowerMessage.includes('password')) {
    return 'Password must be at least 6 characters.';
  }

  if (lowerMessage.includes('email')) {
    return 'Check that the email is typed correctly.';
  }

  return errorMessage || 'Registration failed. Check Supabase Auth settings.';
}
