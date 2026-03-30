"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { catalogProducts } from "../lib/catalog";

const VIEWED_PRODUCTS_KEY = "glitched-viewed-products";

type RecentlyViewedRailProps = {
  title?: string;
  hideSlug?: string;
};

export default function RecentlyViewedRail({ title = "Continue Your Setup", hideSlug }: RecentlyViewedRailProps) {
  const viewedRaw = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {
          return;
        };
      }

      window.addEventListener("storage", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => {
      return window.localStorage.getItem(VIEWED_PRODUCTS_KEY) ?? "[]";
    },
    () => "[]",
  );

  const slugs = useMemo(() => {
    try {
      const parsed = JSON.parse(viewedRaw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }, [viewedRaw]);

  const items = useMemo(() => {
    const filtered = slugs.filter((slug) => slug !== hideSlug);
    return filtered
      .map((slug) => catalogProducts.find((product) => product.slug === slug))
      .filter((item): item is (typeof catalogProducts)[number] => Boolean(item))
      .slice(0, 6);
  }, [hideSlug, slugs]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed" aria-label="Recently viewed products">
      <header>
        <p>Recently Viewed</p>
        <h2>{title}</h2>
      </header>
      <div className="recently-viewed-grid">
        {items.map((item) => (
          <article key={item.slug}>
            <p>{item.category}</p>
            <h3>
              <Link href={`/products/${item.slug}`}>{item.name}</Link>
            </h3>
            <span>{item.price}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
