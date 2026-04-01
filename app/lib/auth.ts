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
