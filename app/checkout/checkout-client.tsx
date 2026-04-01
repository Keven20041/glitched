"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { cartUpdatedEventName, getCartItems, type CartItem } from "../lib/cart";
import StoreTrustBar from "../components/store-trust-bar";

type CheckoutClientProps = {
  initialFullName?: string;
  initialEmail?: string;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function CheckoutClient({ initialFullName = "", initialEmail = "" }: CheckoutClientProps) {
  const items = useSyncExternalStore<CartItem[]>(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      window.addEventListener(cartUpdatedEventName, onStoreChange);
      window.addEventListener("storage", onStoreChange);

      return () => {
        window.removeEventListener(cartUpdatedEventName, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    getCartItems,
    () => [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfileDefaults = async () => {
      const response = await fetch("/api/account/profile", { cache: "no-store" });
      if (!response.ok || !isMounted) {
        return;
      }

      const data = (await response.json()) as {
        user?: { name?: string; email?: string };
        preferences?: { address?: string; city?: string };
      };

      if (data.user?.name) {
        setFullName(data.user.name);
      }

      if (data.user?.email) {
        setEmail(data.user.email);
      }

      setAddress(data.preferences?.address ?? "");
      setCity(data.preferences?.city ?? "");
    };

    loadProfileDefaults().catch(() => {
      return;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    setCheckoutError("");
    setIsSubmitting(true);

    try {
      const payload = {
        items,
        customer: {
          fullName,
          email,
          address,
          city,
        },
      };

      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { id?: string; url?: string; error?: string };

      if (!response.ok || !data.id || !data.url) {
        setCheckoutError(data.error ?? "Unable to start checkout.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setCheckoutError("Checkout failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Checkout form">
        <header className="checkout-header">
          <p>CHECKOUT</p>
          <h1>Secure Checkout</h1>
          <p>Complete payment securely using Stripe Checkout.</p>
        </header>

        {items.length === 0 ? (
          <section className="checkout-summary">
            <h2>Your cart is empty</h2>
            <Link href="/" className="checkout-link">
              Back To Store
            </Link>
          </section>
        ) : (
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                required
                type="text"
                name="fullName"
                placeholder="Your name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Shipping Address
              <input
                required
                type="text"
                name="address"
                placeholder="Street address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
            <label>
              City
              <input
                required
                type="text"
                name="city"
                placeholder="City"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>

            <section className="checkout-summary" aria-label="Checkout summary">
              <h2>Summary</h2>
              <div className="checkout-row">
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>
              <div className="checkout-row">
                <span>Total</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              {checkoutError && <p className="checkout-warning">{checkoutError}</p>}
              <button type="submit" className="checkout-link" disabled={isSubmitting}>
                {isSubmitting ? "Redirecting..." : "Pay With Stripe"}
              </button>
            </section>

            <StoreTrustBar compact />
          </form>
        )}
      </section>
    </main>
  );
}
