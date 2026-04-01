"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, useSession } from "@/app/lib/auth-client";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
};

const getPasswordStrength = (password: string) => {
  if (!password) {
    return { score: 0, label: "" };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (score <= 1) {
    return { score, label: "Weak" };
  }

  if (score <= 3) {
    return { score, label: "Medium" };
  }

  return { score, label: "Strong" };
};

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";
  const { data: session, isPending } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordHints = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Uppercase and lowercase letters",
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      label: "At least one number",
      met: /\d/.test(password),
    },
    {
      label: "At least one symbol",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

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
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await signUp.email({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password,
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
      setError(getErrorMessage(error, "Unable to create account. Please try again."));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-shell auth-shell" aria-label="Sign up">
        <header className="checkout-header">
          <p>AUTH</p>
          <h1>Create Account</h1>
          <p>Save your profile and track your orders in one place.</p>
          <div className="auth-links" aria-label="Authentication links">
            <Link href="/login" className="auth-link-chip">
              Sign in instead
            </Link>
            <Link href="/forgot-password" className="auth-link-chip">
              Forgot password
            </Link>
          </div>
        </header>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input required type="text" name="name" placeholder="Your name" autoComplete="name" />
          </label>
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
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
            <div className="password-strength" aria-live="polite">
              <div className="password-strength-track" aria-hidden="true">
                <div className={`password-strength-fill score-${passwordStrength.score}`} />
              </div>
              <span className="password-strength-label">
                Strength: {passwordStrength.label || "Too short"}
              </span>
            </div>
            <ul className="password-hints" aria-label="Password requirements">
              {passwordHints.map((hint) => (
                <li key={hint.label} className={hint.met ? "is-met" : ""}>
                  {hint.met ? "OK" : "-"} {hint.label}
                </li>
              ))}
            </ul>
          </label>
          <label>
            Confirm Password
            <div className="password-input-row">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                onKeyUp={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
                onKeyDown={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <p className="checkout-warning">{error}</p>}

          <button type="submit" className="checkout-link" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
}
