"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addCartItem, clearCart } from "../../lib/cart";
import { catalogProducts } from "../../lib/catalog";
import StoreTrustBar from "../../components/store-trust-bar";

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
    status: string;
    trackingUrl?: string;
  };
};

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const referralCode = "SQUAD10";

  const upsellItems = catalogProducts.slice(0, 3);

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
            <strong>{order?.purchaseId ?? "Order received"}</strong>
          </div>
          <div className="checkout-row">
            <span>Tracking</span>
            <strong>{order?.fulfillment.trackingNumber ?? "Waiting for shipment"}</strong>
          </div>
          <div className="checkout-row">
            <span>Carrier</span>
            <strong>{order?.fulfillment.carrier ?? "Not assigned yet"}</strong>
          </div>
          <div className="checkout-row">
            <span>Shipment Status</span>
            <strong>{order?.fulfillment.status ?? "Being prepared"}</strong>
          </div>
          {order?.fulfillment.trackingUrl ? (
            <a
              href={order.fulfillment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="checkout-link"
            >
              Track Package
            </a>
          ) : (
            <p>Tracking will appear here once your shipment is handed off.</p>
          )}
          <Link href="/" className="checkout-link">
            Return To Store
          </Link>
        </section>

        <section className="checkout-summary" aria-label="Recommended add-ons">
          <h2>Finish Your Setup</h2>
          <p>Add one of these while your first order is processing.</p>
          <div className="upsell-grid">
            {upsellItems.map((item) => (
              <article key={item.slug} className="upsell-card">
                <h3>{item.name}</h3>
                <p>{item.price}</p>
                <button
                  type="button"
                  className="checkout-link"
                  onClick={() => {
                    addCartItem({
                      id: item.slug,
                      name: item.name,
                      price: Number(item.price.replace("$", "")),
                      quantity: 1,
                    });
                  }}
                >
                  Add To Cart
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="checkout-summary" aria-label="Referral rewards">
          <h2>Invite Your Squad</h2>
          <p>Share your referral code and your friends get 10% off their first order.</p>
          <div className="checkout-row">
            <span>Referral Code</span>
            <strong>{referralCode}</strong>
          </div>
          <button
            type="button"
            className="checkout-link"
            onClick={async () => {
              await navigator.clipboard.writeText(referralCode);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy Code"}
          </button>
        </section>

        <StoreTrustBar compact />
      </section>
    </main>
  );
}

export default function CheckoutSuccessClient() {
  return (
    <Suspense
      fallback={
        <main className="checkout-page">
          <section className="checkout-shell" aria-label="Payment success loading state">
            <header className="checkout-header">
              <p>PAYMENT SUCCESS</p>
              <h1>Order confirmed</h1>
              <p>Loading your order details...</p>
            </header>
          </section>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
