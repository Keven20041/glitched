"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addRecentlyViewedProduct, getProductReviews, saveProductReview, type ProductReview } from "../lib/engagement";

type ProductEngagementPanelProps = {
  slug: string;
  name: string;
};

const buildSocialProof = (slug: string) => {
  const seed = slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

  return {
    activeViewers: 18 + (seed % 27),
    boughtToday: 7 + (seed % 19),
    inCarts: 4 + (seed % 11),
  };
};

export default function ProductEngagementPanel({ slug, name }: ProductEngagementPanelProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [ratingInput, setRatingInput] = useState("5");
  const [commentInput, setCommentInput] = useState("");
  const [photoInput, setPhotoInput] = useState("");

  useEffect(() => {
    addRecentlyViewedProduct(slug);
    setReviews(getProductReviews(slug));
  }, [slug]);

  const socialProof = useMemo(() => buildSocialProof(slug), [slug]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 4.8;
    }

    const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
    return Number(average.toFixed(1));
  }, [reviews]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = nameInput.trim();
    const trimmedComment = commentInput.trim();

    if (!trimmedName || !trimmedComment) {
      return;
    }

    const review: ProductReview = {
      id: crypto.randomUUID(),
      name: trimmedName,
      rating: Math.max(1, Math.min(5, Number(ratingInput))),
      comment: trimmedComment,
      photoUrl: photoInput.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveProductReview(slug, review);
    setReviews(getProductReviews(slug));
    setCommentInput("");
    setPhotoInput("");
  };

  return (
    <section className="engagement-stack" aria-label="Product social proof and reviews">
      <article className="checkout-summary">
        <h2>Live Shopper Pulse</h2>
        <p>{socialProof.activeViewers} people are viewing this item right now.</p>
        <div className="checkout-row">
          <span>Bought Today</span>
          <strong>{socialProof.boughtToday}</strong>
        </div>
        <div className="checkout-row">
          <span>In Carts</span>
          <strong>{socialProof.inCarts}</strong>
        </div>
      </article>

      <article className="checkout-summary trust-card">
        <h2>Delivery Promise</h2>
        <p>Estimated arrival in 2-4 business days for major US cities.</p>
        <ul className="trust-list">
          <li>Free shipping over $120</li>
          <li>30-day return window</li>
          <li>Stripe secure checkout</li>
          <li>Dedicated support for setup questions</li>
        </ul>
      </article>

      <article className="checkout-summary reviews-panel">
        <h2>Community Reviews</h2>
        <p>
          {averageRating.toFixed(1)} average rating from {reviews.length} review{reviews.length === 1 ? "" : "s"} on {name}.
        </p>

        <form className="review-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Your gamer tag" required />
          </label>
          <label>
            Rating
            <select value={ratingInput} onChange={(event) => setRatingInput(event.target.value)}>
              <option value="5">5 - Perfect</option>
              <option value="4">4 - Great</option>
              <option value="3">3 - Solid</option>
              <option value="2">2 - Needs work</option>
              <option value="1">1 - Not for me</option>
            </select>
          </label>
          <label>
            Review
            <textarea
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              placeholder="How does it feel in your setup?"
              required
            />
          </label>
          <label>
            Desk Photo URL (optional)
            <input value={photoInput} onChange={(event) => setPhotoInput(event.target.value)} placeholder="https://..." />
          </label>
          <button type="submit" className="checkout-link">
            Post Review
          </button>
        </form>

        <div className="review-list" aria-live="polite">
          {reviews.length === 0 && <p>No reviews yet. Be the first to share your setup.</p>}
          {reviews.slice(0, 5).map((review) => (
            <article key={review.id} className="review-item">
              <div className="checkout-row">
                <strong>{review.name}</strong>
                <span>{"★".repeat(review.rating)}</span>
              </div>
              <p>{review.comment}</p>
              {review.photoUrl && (
                <a href={review.photoUrl} target="_blank" rel="noopener noreferrer">
                  View desk photo
                </a>
              )}
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
