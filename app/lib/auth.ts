import { betterAuth } from "better-auth";
import { Pool } from "pg";

declare global {
  var __betterAuthPool: Pool | undefined;
}

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL (or DATABASE_URL) for Better Auth.");
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

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
