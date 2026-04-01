"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      await authClient.$fetch("/reset-password", {
        method: "POST",
        body: {
          token,
          newPassword,
        },
      });

      setSuccess("Password reset successful. You can sign in with your new password.");
    } catch (error) {
      setError(getErrorMessage(error, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell auth-shell" aria-label="Reset password">
        <header className="checkout-header">
          <p>AUTH</p>
          <h1>Reset Password</h1>
          <p>Set a new password for your account.</p>
          <div className="auth-links" aria-label="Authentication links">
            <Link href="/login" className="auth-link-chip">
              Back to sign in
            </Link>
            <Link href="/forgot-password" className="auth-link-chip">
              Request new link
            </Link>
          </div>
        </header>

        {!hasToken ? (
          <section className="checkout-summary">
            <p className="checkout-warning">Missing reset token. Request a new reset link.</p>
            <Link href="/forgot-password" className="checkout-link">
              Request Reset Link
            </Link>
          </section>
        ) : (
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              New Password
              <input required type="password" name="newPassword" placeholder="New password" autoComplete="new-password" />
            </label>
            <label>
              Confirm Password
              <input
                required
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </label>

            {error && <p className="checkout-warning">{error}</p>}
            {success && <p className="checkout-success">{success}</p>}

            <button type="submit" className="checkout-link" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
