"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "@/app/lib/auth-client";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
};

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";
  const { data: session, isPending } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user?.id) {
      router.replace(nextPath);
    }
  }, [isPending, nextPath, router, session?.user?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      const result = response as { error?: { message?: string } | null };

      if (result?.error?.message) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setError(getErrorMessage(error, "Unable to sign in. Check your credentials and try again."));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell auth-shell" aria-label="Login">
        <header className="checkout-header">
          <p>AUTH</p>
          <h1>Sign In</h1>
          <p>Access your account, saved checkout flow, and order history.</p>
          <div className="auth-links" aria-label="Authentication links">
            <Link href="/signup" className="auth-link-chip">
              Create account
            </Link>
            <Link href="/forgot-password" className="auth-link-chip">
              Reset password
            </Link>
          </div>
        </header>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input required type="email" name="email" placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            Password
            <div className="password-input-row">
              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                autoComplete="current-password"
                onKeyUp={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
                onKeyDown={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {capsLockOn && <span className="password-caps-hint">Caps Lock is on</span>}
          </label>

          {error && <p className="checkout-warning">{error}</p>}

          <button type="submit" className="checkout-link" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
