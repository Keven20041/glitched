import { betterAuth } from "better-auth";
import { Pool } from "pg";

declare global {
  var __betterAuthPool: Pool | undefined;
  var __betterAuth: ReturnType<typeof betterAuth> | undefined;
}

const normalizeConnectionString = (value: string) => {
  try {
    const url = new URL(value);
    // Avoid sslmode overriding node-postgres ssl object config.
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return value;
  }
};

const getTrustedOrigins = (baseURL: string) => {
  const origins = new Set<string>();

  try {
    origins.add(new URL(baseURL).origin);
  } catch {
    // Ignore invalid URLs here; auth() already validates baseURL separately.
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:*");
    origins.add("https://localhost:*");
    origins.add("http://127.0.0.1:*");
    origins.add("https://127.0.0.1:*");
    origins.add("http://[::1]:*");
    origins.add("https://[::1]:*");
  }

  if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
    for (const origin of process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")) {
      const trimmedOrigin = origin.trim();
      if (trimmedOrigin) {
        origins.add(trimmedOrigin);
      }
    }
  }

  return [...origins];
};

function getAuth(): ReturnType<typeof betterAuth> {
  if (globalThis.__betterAuth) {
    return globalThis.__betterAuth;
  }

  const baseURL =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!baseURL) {
    throw new Error("Missing BETTER_AUTH_URL. Set it in your deployment environment.");
  }

  if (!secret) {
    throw new Error("Missing BETTER_AUTH_SECRET. Set it in your deployment environment.");
  }

  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL (or DATABASE_URL) for Better Auth.");
  }

  const shouldUseRelaxedTls = /supabase\.com|pooler|sslmode=/i.test(connectionString);

  const pool =
    globalThis.__betterAuthPool ??
    new Pool({
      connectionString: normalizeConnectionString(connectionString),
      ssl: shouldUseRelaxedTls
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__betterAuthPool = pool;
  }

  const auth = betterAuth({
    baseURL,
    secret,
    trustedOrigins: getTrustedOrigins(baseURL),
    database: pool,
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // Temporary local implementation: surface the reset URL in server logs.
        // Swap this with your transactional email provider when ready.
        console.log(`[Better Auth] Password reset link for ${user.email}: ${url}`);
      },
    },
  });

  globalThis.__betterAuth = auth as ReturnType<typeof betterAuth>;
  return globalThis.__betterAuth;
}

export { getAuth as auth };
