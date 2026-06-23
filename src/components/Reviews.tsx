import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Review = {
  id: string;
  text: string;
  created_at: string;
};

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadReviews() {
    if (!supabase) {
      setMessage('Supabase keys are not configured.');
      return;
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('id, text, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setReviews(data ?? []);
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  async function addReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || !supabase) {
      return;
    }

    setBusy(true);
    setMessage('');

    const { error } = await supabase.from('reviews').insert({ text: cleanText });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setText('');
    setMessage('Review saved.');
    await loadReviews();
  }

  async function removeReview(id: string) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadReviews();
  }

  return (
    <section className="reviews-panel" aria-label="My reviews">
      <div>
        <p className="eyebrow">Private</p>
        <h2>My reviews</h2>
        <p className="reviews-note">Only your account can read these reviews.</p>
      </div>

      <form className="review-form" onSubmit={addReview}>
        <textarea
          maxLength={500}
          placeholder="Write your review..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? 'Saving...' : 'Save review'}
        </button>
      </form>

      {message ? <p className="auth-message">{message}</p> : null}

      {reviews.length > 0 ? (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <span>{review.text}</span>
              <button type="button" className="review-delete" onClick={() => removeReview(review.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="reviews-empty">No reviews yet.</p>
      )}
    </section>
  );
}
