"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearCart } from "../../lib/cart";

type TrackedOrder = {
  purchaseId: string;
  customer: {
    fullName: string;
    email?: string;
  };
  fulfillment: {
    trackingNumber: string;
    externalOrderId: string;
    carrier: string;
  };
};

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    clearCart();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;

    const loadTrackedOrder = async () => {
      const response = await fetch(
        `/api/orders?session_id=${encodeURIComponent(sessionId)}`,
      );

      if (!response.ok || !isMounted) {
        return;
      }

      const data = (await response.json()) as TrackedOrder;
      setOrder(data);
    };

    loadTrackedOrder().catch(() => {
      return;
    });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

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
            <span>Purchase ID</span>
            <strong>{order?.purchaseId ?? "Pending webhook"}</strong>
          </div>
          <div className="checkout-row">
            <span>Session</span>
            <strong>{sessionId ?? "Unavailable"}</strong>
          </div>
          <div className="checkout-row">
            <span>Tracking</span>
            <strong>{order?.fulfillment.trackingNumber ?? "Preparing"}</strong>
          </div>
          <div className="checkout-row">
            <span>Customer</span>
            <strong>{order?.customer.fullName ?? "Pending webhook"}</strong>
          </div>
          <Link href="/" className="checkout-link">
            Return To Store
          </Link>
        </section>
      </section>
    </main>
  );
}
