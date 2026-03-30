"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalogProducts } from "../lib/catalog";
import { getRecentlyViewedProducts } from "../lib/engagement";

type RecentlyViewedRailProps = {
  title?: string;
  hideSlug?: string;
};

export default function RecentlyViewedRail({ title = "Continue Your Setup", hideSlug }: RecentlyViewedRailProps) {
  const [slugs] = useState<string[]>(() => getRecentlyViewedProducts());

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
