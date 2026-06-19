import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { MarioGame } from './components/MarioGame';
import { Auth } from './components/Auth';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoadingSession(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsPlaying(false);
      setLoadingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setIsPlaying(false);
  }

  if (isPlaying) {
    return <MarioGame />;
  }

  return (
    <main className="home-screen">
      <section className="home-hero" aria-label="Main screen">
        <div className="home-copy">
          <p className="eyebrow">nFactorial Teens</p>
          <h1>Lucky Blocks</h1>
          <p className="home-text">
            Jump through pixel levels, hit lucky blocks, collect coins, and buy power-ups before the boss.
          </p>

          <div className="home-actions">
            <button
              type="button"
              className="start-button"
              disabled={!session || loadingSession}
              onClick={() => setIsPlaying(true)}
            >
              Play
            </button>
            <div className="home-controls-note" aria-label="Controls">
              <span>Move: A / D</span>
              <span>Jump: Space</span>
            </div>
          </div>

          <div className="home-loadout" aria-label="Power-ups">
            <span>+1 life</span>
            <span>Super jump</span>
            <span>Speed</span>
            <span>Star</span>
          </div>
        </div>

        <div className="home-auth">
          {loadingSession ? (
            <section className="auth-card">
              <h2>Loading...</h2>
            </section>
          ) : session ? (
            <section className="auth-card">
              <p className="eyebrow">Account</p>
              <h2>Ready to play</h2>
              <p className="auth-message">{session.user.email}</p>
              <button type="button" className="ghost-button" onClick={signOut}>
                Sign out
              </button>
            </section>
          ) : (
            <Auth />
          )}
        </div>

        <div className="home-preview" aria-hidden="true">
          <div className="preview-sky">
            <div className="preview-sun" />
            <div className="preview-cloud preview-cloud-one" />
            <div className="preview-cloud preview-cloud-two" />
            <div className="preview-hill preview-hill-one" />
            <div className="preview-hill preview-hill-two" />
            <div className="preview-platform preview-platform-one" />
            <div className="preview-platform preview-platform-two" />
            <div className="preview-block">?</div>
            <div className="preview-block preview-block-small">?</div>
            <div className="preview-coin" />
            <div className="preview-coin preview-coin-two" />
            <div className="preview-shop-sign">SHOP</div>
            <div className="preview-enemy" />
            <div className="preview-player" />
            <div className="preview-flag" />
            <div className="preview-ground" />
          </div>
        </div>
      </section>

      <section className="home-info" aria-label="Game details">
        <div>
          <h2>Goal</h2>
          <p>Reach the flag, collect coins, and survive every level.</p>
        </div>
        <div>
          <h2>Lucky blocks</h2>
          <p>Hit yellow blocks from below to get coins or power-ups.</p>
        </div>
        <div>
          <h2>Shop</h2>
          <p>Spend coins on lives, speed, high jumps, and star power.</p>
        </div>
      </section>

      <section className="home-stats" aria-label="Game features">
        <div>
          <strong>20</strong>
          <span>levels</span>
        </div>
        <div>
          <strong>5</strong>
          <span>lives</span>
        </div>
        <div>
          <strong>4</strong>
          <span>shop items</span>
        </div>
      </section>
    </main>
  );
}
