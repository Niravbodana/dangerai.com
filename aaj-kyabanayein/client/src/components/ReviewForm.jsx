import { useEffect, useState } from "react";
import { IconStar } from "./Icons";

export default function ReviewForm({ initialScore = 0, onSubmit, loading = false, submitLabel = "Submit Review" }) {
  const [score, setScore] = useState(initialScore);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialScore) setScore(initialScore);
  }, [initialScore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score) return;
    await onSubmit(score, comment);
    setSubmitted(true);
    setComment("");
  };

  if (submitted) {
    return (
      <p role="status" className="rounded-xl bg-[var(--accent-green)]/10 px-4 py-3 text-sm text-[var(--accent-green)]">
        Thank you! Your review has been saved.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Your rating</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`Rate ${s} out of 5 stars`}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setScore(s)}
              className="transition hover:scale-110"
            >
              <IconStar
                filled={s <= (hover || score)}
                className={`h-9 w-9 ${s <= (hover || score) ? "text-[var(--accent-soft)]" : "text-white/25"}`}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Your review (optional)
        </label>
        <textarea
          id="review-comment"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Tell us how the recipe turned out..."
          className="glass-input resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!score || loading}
        className="premium-btn w-full py-3 text-sm disabled:opacity-40"
      >
        {loading ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
}
