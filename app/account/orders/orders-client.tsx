"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/app/lib/auth-client";

type OrderSummary = {
  purchaseId: string;
  createdAt: string;
  status: "paid";
  items: { name: string; quantity: number; unitAmount: number; currency: string }[];
  fulfillment: {
    trackingNumber: string;
    carrier: string;
  };
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type OrdersClientProps = {
  userName?: string;
  userEmail?: string;
};

export default function OrdersClient({ userName, userEmail }: OrdersClientProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders/mine", { cache: "no-store" });
        const data = (await response.json()) as { orders?: OrderSummary[]; error?: string };

        if (!response.ok) {
          if (isMounted) {
            setError(data.error ?? "Unable to load orders.");
          }
          return;
        }

        if (isMounted) {
          setOrders(data.orders ?? []);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load orders.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders().catch(() => {
      return;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Account orders">
        <header className="checkout-header">
          <p>ACCOUNT</p>
          <h1>Your Orders</h1>
          <p>{userName ? `Signed in as ${userName}` : userEmail ? `Signed in as ${userEmail}` : "Signed in"}</p>
        </header>

        <section className="checkout-summary" aria-label="Account actions">
          <div className="checkout-row">
            <span>Quick links</span>
            <strong>
              <Link href="/account/profile">Profile</Link>
            </strong>
          </div>
          <div className="checkout-row">
            <span></span>
            <strong>
              <Link href="/">Store</Link>
            </strong>
          </div>
          <button
            type="button"
            className="checkout-link"
            onClick={async () => {
              await signOut();
              window.location.assign("/");
            }}
          >
            Sign Out
          </button>
        </section>

        {loading ? (
          <section className="checkout-summary">
            <h2>Loading orders...</h2>
          </section>
        ) : error ? (
          <section className="checkout-summary">
            <p className="checkout-warning">{error}</p>
          </section>
        ) : orders.length === 0 ? (
          <section className="checkout-summary">
            <h2>No orders yet</h2>
            <p>Once you complete checkout, your purchases will appear here.</p>
            <Link href="/" className="checkout-link">
              Start Shopping
            </Link>
          </section>
        ) : (
          <section className="checkout-summary" aria-label="Order history">
            <h2>Order History</h2>
            {orders.map((order) => {
              const total = order.items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0) / 100;

              return (
                <article key={order.purchaseId} className="upsell-card">
                  <div className="checkout-row">
                    <span>Purchase ID</span>
                    <strong>{order.purchaseId}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Date</span>
                    <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Total</span>
                    <strong>{currency.format(total)}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Tracking</span>
                    <strong>{order.fulfillment?.trackingNumber ?? "Preparing"}</strong>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
