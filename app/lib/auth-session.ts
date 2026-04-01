import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type AppAuthSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  session: {
    userId: string;
  };
};

const normalizeSession = (value: unknown): AppAuthSession | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeData = (value as { data?: unknown }).data;
  const candidate = (maybeData && typeof maybeData === "object" ? maybeData : value) as {
    user?: { id?: string; name?: string | null; email?: string | null };
    session?: { userId?: string };
  };

  if (!candidate.user?.id || !candidate.session?.userId) {
    return null;
  }

  return {
    user: {
      id: candidate.user.id,
      name: candidate.user.name,
      email: candidate.user.email,
    },
    session: {
      userId: candidate.session.userId,
    },
  };
};

export const getServerAuthSession = async (): Promise<AppAuthSession | null> => {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });
  return normalizeSession(session);
};

export const getRequestAuthSession = async (request: Request): Promise<AppAuthSession | null> => {
  const session = await auth.api.getSession({ headers: request.headers });
  return normalizeSession(session);
};

export const requireServerAuthSession = async (nextPath: string): Promise<AppAuthSession> => {
  const session = await getServerAuthSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
};
