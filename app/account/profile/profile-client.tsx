"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { authClient, signOut } from "@/app/lib/auth-client";

type ProfileClientProps = {
  initialName: string;
  initialEmail: string;
};

type ProfileResponse = {
  preferences?: {
    address?: string;
    city?: string;
  };
  error?: string;
};

type NewsletterResponse = {
  subscription?: {
    email?: string;
    status?: string;
    subscribedAt?: string;
  } | null;
  message?: string;
  error?: string;
};

type AccountOrder = {
  purchaseId: string;
  createdAt: string;
  status: string;
  items: { name: string; quantity: number; unitAmount: number; currency: string }[];
  fulfillment?: {
    carrier: string;
    status: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
};

const newsletterButtonLabel = (status: string | null) => {
  if (status === "active") {
    return "Leave Drop List";
  }

  return "Join Drop List";
};

export default function ProfileClient({ initialName, initialEmail }: ProfileClientProps) {
  const [name, setName] = useState(initialName);
  const [email] = useState(initialEmail);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [dropListStatus, setDropListStatus] = useState<string | null>(null);
  const [dropListMessage, setDropListMessage] = useState("");
  const [dropListLoading, setDropListLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersUpdatedAt, setOrdersUpdatedAt] = useState<string | null>(null);

  const dropListLabel =
    dropListStatus === "active" ? "Subscribed to Newsletter" : dropListStatus ? "Not Subscribed" : "Newsletter Status";

  const latestOrder = useMemo(() => orders[0] ?? null, [orders]);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      const [profileResponse, newsletterResponse] = await Promise.all([
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch("/api/newsletter", { cache: "no-store" }),
      ]);

      if (!isMounted) {
        return;
      }

      if (profileResponse.ok) {
        const data = (await profileResponse.json()) as ProfileResponse;
        setAddress(data.preferences?.address ?? "");
        setCity(data.preferences?.city ?? "");
      }

      if (newsletterResponse.ok) {
        const data = (await newsletterResponse.json()) as NewsletterResponse;
        setDropListStatus(data.subscription?.status ?? null);
      }
    };

    loadPreferences().catch(() => {
      return;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }

    let isMounted = true;
    const pollTimer = setInterval(() => {
      loadOrders().catch(() => {
        return;
      });
    }, 15000);

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await fetch("/api/orders/mine", { cache: "no-store" });
        const data = (await response.json()) as { orders?: AccountOrder[]; error?: string };

        if (!response.ok) {
          if (isMounted) {
            setOrdersError(data.error ?? "Unable to load orders.");
          }
          return;
        }

        if (isMounted) {
          setOrders(data.orders ?? []);
          setOrdersUpdatedAt(new Date().toISOString());
        }
      } catch {
        if (isMounted) {
          setOrdersError("Unable to load orders.");
        }
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders().catch(() => {
      return;
    });

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [activeTab]);

  const renderOrdersTab = () => {
    if (ordersLoading && orders.length === 0) {
      return (
        <section className="checkout-summary">
          <h2>Loading order status...</h2>
        </section>
      );
    }

    if (ordersError) {
      return (
        <section className="checkout-summary">
          <p className="checkout-warning">{ordersError}</p>
        </section>
      );
    }

    if (orders.length === 0) {
      return (
        <section className="checkout-summary">
          <h2>No orders yet</h2>
          <p>Once you complete checkout, your payment and shipment status will appear here.</p>
          <Link href="/" className="checkout-link">
            Start Shopping
          </Link>
        </section>
      );
    }

    return (
      <section className="checkout-summary" aria-label="Live order status">
        <div className="checkout-row">
          <span>Last refreshed</span>
          <strong>{ordersUpdatedAt ? new Date(ordersUpdatedAt).toLocaleTimeString() : "Just now"}</strong>
        </div>

        {latestOrder ? (
          <article className="upsell-card">
            <h2>Latest Order</h2>
            <div className="checkout-row">
              <span>Order ID</span>
              <strong>{latestOrder.purchaseId}</strong>
            </div>
            <div className="checkout-row">
              <span>Payment</span>
              <strong>{latestOrder.status}</strong>
            </div>
            <div className="checkout-row">
              <span>Shipment</span>
              <strong>{latestOrder.fulfillment?.status ?? "Preparing"}</strong>
            </div>
            <div className="checkout-row">
              <span>Carrier</span>
              <strong>{latestOrder.fulfillment?.carrier ?? "Not assigned yet"}</strong>
            </div>
            <div className="checkout-row">
              <span>Tracking</span>
              <strong>{latestOrder.fulfillment?.trackingNumber ?? "Waiting for shipment"}</strong>
            </div>
            {latestOrder.fulfillment?.trackingUrl ? (
              <a
                href={latestOrder.fulfillment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="checkout-link"
              >
                Track Package
              </a>
            ) : null}
          </article>
        ) : null}

        <div style={{ display: "grid", gap: "12px" }}>
          {orders.map((order) => (
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
                <span>Payment</span>
                <strong>{order.status}</strong>
              </div>
              <div className="checkout-row">
                <span>Shipment</span>
                <strong>{order.fulfillment?.status ?? "Preparing"}</strong>
              </div>
              <div className="checkout-row">
                <span>Tracking</span>
                <strong>{order.fulfillment?.trackingNumber ?? "Waiting for shipment"}</strong>
              </div>
              {order.fulfillment?.trackingUrl ? (
                <a
                  href={order.fulfillment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="checkout-link"
                >
                  Track Package
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      if (name.trim() !== initialName.trim()) {
        const response = (await authClient.$fetch("/update-user", {
          method: "POST",
          body: { name: name.trim() },
        })) as { error?: { message?: string } | null };

        if (response?.error?.message) {
          setError(response.error.message);
          setIsSaving(false);
          return;
        }
      }

      const preferencesResponse = await fetch("/api/account/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
        }),
      });

      if (!preferencesResponse.ok) {
        const data = (await preferencesResponse.json()) as ProfileResponse;
        setError(data.error ?? "Unable to save profile.");
        setIsSaving(false);
        return;
      }

      setSuccess("Profile updated.");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDropListToggle = async () => {
    setDropListLoading(true);
    setDropListMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: dropListStatus === "active" ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: dropListStatus === "active"
          ? undefined
          : JSON.stringify({
              email,
              name: name.trim(),
              source: "account-profile",
            }),
      });

      const data = (await response.json()) as NewsletterResponse;

      if (!response.ok) {
        setDropListMessage(data.error ?? "Unable to update drop list.");
        return;
      }

      setDropListStatus(data.subscription?.status ?? null);
      setDropListMessage(data.message ?? "Drop list updated.");
    } catch {
      setDropListMessage("Unable to update drop list.");
    } finally {
      setDropListLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Account profile">
        <header className="checkout-header">
          <div className="checkout-header-top">
            <p>ACCOUNT</p>
            <span className={`account-newsletter-chip ${dropListStatus === "active" ? "is-active" : ""}`}>
              {dropListLabel}
            </span>
          </div>
          <h1>Your Profile</h1>
          <p>Manage your display name and default checkout details.</p>
        </header>

        <section className="checkout-summary" aria-label="Account tabs">
          <div className="checkout-row">
            <button type="button" className="checkout-link" onClick={() => setActiveTab("profile")}>
              Profile
            </button>
            <button type="button" className="checkout-link" onClick={() => setActiveTab("orders")}>
              Orders
            </button>
          </div>
          <p>{activeTab === "profile" ? "Update your account details and defaults." : "Watch your latest order update automatically."}</p>
        </section>

        {activeTab === "profile" ? (
          <>
            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>
                Display Name
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
              </label>
              <label>
                Email
                <input type="email" value={email} readOnly disabled aria-disabled="true" />
              </label>
              <label>
                Default Shipping Address
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street address"
                />
              </label>
              <label>
                Default City
                <input type="text" value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
              </label>

              {error && <p className="checkout-warning">{error}</p>}
              {success && <p className="checkout-success">{success}</p>}

              <button type="submit" className="checkout-link" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>

            <section className="checkout-summary" aria-label="Account actions">
              <h2>Quick Links</h2>
              <div className="checkout-row">
                <span>Drop List</span>
                <strong>{dropListStatus === "active" ? "Joined" : "Not joined"}</strong>
              </div>
              {dropListMessage && (
                <p className={dropListStatus === "active" ? "checkout-success" : "checkout-warning"}>
                  {dropListMessage}
                </p>
              )}
              <button type="button" className="checkout-link" onClick={handleDropListToggle} disabled={dropListLoading}>
                {dropListLoading ? "Updating..." : newsletterButtonLabel(dropListStatus)}
              </button>
              <div className="checkout-row">
                <span>Orders</span>
                <strong>
                  <button type="button" className="checkout-link" onClick={() => setActiveTab("orders")}>
                    View Orders
                  </button>
                </strong>
              </div>
              <div className="checkout-row">
                <span>Store</span>
                <strong>
                  <Link href="/">Back to Store</Link>
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
          </>
        ) : (
          <>
            {renderOrdersTab()}
            <section className="checkout-summary" aria-label="Account actions">
              <h2>Account Links</h2>
              <div className="checkout-row">
                <span>Profile</span>
                <strong>
                  <button type="button" className="checkout-link" onClick={() => setActiveTab("profile")}>
                    Edit Details
                  </button>
                </strong>
              </div>
              <div className="checkout-row">
                <span>Store</span>
                <strong>
                  <Link href="/">Back to Store</Link>
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
          </>
        )}
      </section>
    </main>
  );
}
