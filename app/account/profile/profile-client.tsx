"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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

  const dropListLabel =
    dropListStatus === "active" ? "Subscribed to Newsletter" : dropListStatus ? "Not Subscribed" : "Newsletter Status";

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
              <Link href="/account/orders">View Orders</Link>
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
      </section>
    </main>
  );
}
