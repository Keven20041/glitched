"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getCartItems, type CartItem } from "../lib/cart";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function CheckoutPage() {
  const [items] = useState<CartItem[]>(() => getCartItems());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    setCheckoutError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        items,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          address: String(formData.get("address") ?? ""),
          city: String(formData.get("city") ?? ""),
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
              <input required type="text" name="fullName" placeholder="Your name" />
            </label>
            <label>
              Email
              <input required type="email" name="email" placeholder="you@example.com" />
            </label>
            <label>
              Shipping Address
              <input required type="text" name="address" placeholder="Street address" />
            </label>
            <label>
              City
              <input required type="text" name="city" placeholder="City" />
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
          </form>
        )}
      </section>
    </main>
  );
}
