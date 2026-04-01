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

export default function ProfileClient({ initialName, initialEmail }: ProfileClientProps) {
  const [name, setName] = useState(initialName);
  const [email] = useState(initialEmail);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      const response = await fetch("/api/account/profile", { cache: "no-store" });
      if (!response.ok || !isMounted) {
        return;
      }

      const data = (await response.json()) as ProfileResponse;
      setAddress(data.preferences?.address ?? "");
      setCity(data.preferences?.city ?? "");
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

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Account profile">
        <header className="checkout-header">
          <p>ACCOUNT</p>
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
