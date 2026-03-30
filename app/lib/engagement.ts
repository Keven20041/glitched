export type ProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAt: string;
};

const VIEWED_PRODUCTS_KEY = "glitched-viewed-products";
const NEWSLETTER_CTA_DISMISSED_KEY = "glitched-newsletter-dismissed";

const isBrowser = () => typeof window !== "undefined";

const safeParseStringArray = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const safeParseReviews = (raw: string | null): ProductReview[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProductReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildReviewKey = (slug: string) => {
  return `glitched-reviews-${slug}`;
};

export const addRecentlyViewedProduct = (slug: string) => {
  if (!isBrowser()) {
    return;
  }

  const existing = safeParseStringArray(window.localStorage.getItem(VIEWED_PRODUCTS_KEY));
  const withoutCurrent = existing.filter((item) => item !== slug);
  const next = [slug, ...withoutCurrent].slice(0, 10);
  window.localStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify(next));
};

export const getRecentlyViewedProducts = () => {
  if (!isBrowser()) {
    return [];
  }

  return safeParseStringArray(window.localStorage.getItem(VIEWED_PRODUCTS_KEY));
};

export const getProductReviews = (slug: string) => {
  if (!isBrowser()) {
    return [];
  }

  return safeParseReviews(window.localStorage.getItem(buildReviewKey(slug)));
};

export const saveProductReview = (slug: string, review: ProductReview) => {
  if (!isBrowser()) {
    return;
  }

  const existing = getProductReviews(slug);
  const next = [review, ...existing].slice(0, 30);
  window.localStorage.setItem(buildReviewKey(slug), JSON.stringify(next));
};

export const getNewsletterCtaDismissed = () => {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(NEWSLETTER_CTA_DISMISSED_KEY) === "1";
};

export const setNewsletterCtaDismissed = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(NEWSLETTER_CTA_DISMISSED_KEY, "1");
};
