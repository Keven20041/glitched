"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clearCart } from "../../lib/cart";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Payment success">
        <header className="checkout-header">
          <p>PAYMENT SUCCESS</p>
          <h1>Order confirmed</h1>
          <p>Your payment was processed successfully.</p>
        </header>

        <section className="checkout-summary">
          <div className="checkout-row">
            <span>Session</span>
            <strong>{sessionId ?? "Unavailable"}</strong>
          </div>
          <Link href="/" className="checkout-link">
            Return To Store
          </Link>
        </section>
      </section>
    </main>
  );
}
