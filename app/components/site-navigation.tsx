"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

function getSectionLabel(pathname: string) {
  if (pathname === "/") {
    return "Storefront";
  }

  if (pathname.startsWith("/products/")) {
    return "Product Detail";
  }

  if (pathname.startsWith("/checkout")) {
    return "Checkout";
  }

  if (pathname.startsWith("/cart")) {
    return "Cart";
  }

  if (pathname.startsWith("/account")) {
    return "Account";
  }

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return "Sign In";
  }

  return "Navigation";
}

export default function SiteNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const sectionLabel = useMemo(() => getSectionLabel(pathname), [pathname]);
  const isCart = pathname.startsWith("/cart");

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="site-nav-dock" aria-label="Page navigation">
      <div className="site-nav-meta">
        <span className="site-nav-kicker">Route panel</span>
        <strong>{sectionLabel}</strong>
      </div>
      <div className="site-nav-actions">
        <button
          type="button"
          className="site-nav-button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }

            router.push("/");
          }}
        >
          ← Back
        </button>
        <Link href="/" className="site-nav-link">
          ⌂ Home
        </Link>
        <Link href="/cart" className={`site-nav-link ${isCart ? "is-active" : ""}`}>
          Cart →
        </Link>
      </div>
    </nav>
  );
}
