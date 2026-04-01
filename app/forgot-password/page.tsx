"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
};

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    try {
      await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: {
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      setSuccess("If that email exists, a reset link has been generated. Check server logs in local dev.");
    } catch (error) {
      setError(getErrorMessage(error, "Unable to request password reset."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell auth-shell" aria-label="Forgot password">
        <header className="checkout-header">
          <p>AUTH</p>
          <h1>Forgot Password</h1>
          <p>Request a reset link for your account.</p>
          <div className="auth-links" aria-label="Authentication links">
            <Link href="/login" className="auth-link-chip">
              Back to sign in
            </Link>
            <Link href="/signup" className="auth-link-chip">
              Create account
            </Link>
          </div>
        </header>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input required type="email" name="email" placeholder="you@example.com" autoComplete="email" />
          </label>

          {error && <p className="checkout-warning">{error}</p>}
          {success && <p className="checkout-success">{success}</p>}

          <button type="submit" className="checkout-link" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </section>
    </main>
  );
}
