import { NextResponse } from "next/server";
import { getRequestAuthSession } from "../../lib/auth-session";
import { createClientServer } from "../../utils/supabase/server";

export const runtime = "nodejs";

type NewsletterPayload = {
  email?: string;
  name?: string;
  source?: string;
};

type NewsletterRow = {
  id: string;
  email: string;
  name: string | null;
  user_id: string | null;
  source: string | null;
  status: string;
  opted_in_at: string;
};

const buildSubscriptionResponse = (data: {
  email: string;
  name: string | null;
  user_id: string | null;
  source: string | null;
  status: string;
  opted_in_at: string;
}) => {
  return {
    subscription: {
      email: data.email,
      name: data.name ?? "",
      userId: data.user_id ?? null,
      source: data.source ?? "homepage",
      status: data.status,
      subscribedAt: data.opted_in_at,
    },
  };
};

const toStorageError = (fallback: string, error: unknown) => {
  const code = typeof error === "object" && error !== null ? (error as { code?: string }).code : undefined;

  if (code === "42P01") {
    return "Newsletter storage is not initialized. Run the latest Supabase migrations.";
  }

  return fallback;
};

const findExistingSubscription = async (
  userId: string | null,
  email: string,
) => {
  const supabase = await createClientServer();

  if (userId) {
    const byUser = await supabase
      .from("newsletter_subscriptions")
      .select("id, email, name, user_id, source, status, opted_in_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (byUser.data) {
      return { row: byUser.data as NewsletterRow, error: null };
    }

    if (byUser.error) {
      return { row: null, error: byUser.error };
    }
  }

  const byEmail = await supabase
    .from("newsletter_subscriptions")
    .select("id, email, name, user_id, source, status, opted_in_at")
    .eq("email", email)
    .maybeSingle();

  if (byEmail.error) {
    return { row: null, error: byEmail.error };
  }

  return { row: (byEmail.data as NewsletterRow | null) ?? null, error: null };
};

const getSubscriptionForSession = async (request: Request) => {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return null;
  }

  const email = (authSession.user.email ?? "").trim().toLowerCase();
  if (!email) {
    return null;
  }

  const existing = await findExistingSubscription(authSession.user.id, email);
  if (existing.error || !existing.row) {
    return null;
  }

  if (!existing.row.user_id) {
    const supabase = await createClientServer();
    await supabase
      .from("newsletter_subscriptions")
      .update({ user_id: authSession.user.id, updated_at: new Date().toISOString() })
      .eq("id", existing.row.id);
  }

  return buildSubscriptionResponse({
    ...existing.row,
    user_id: authSession.user.id,
  });
};

export async function GET(request: Request) {
  const subscription = await getSubscriptionForSession(request);

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json(subscription);
}

export async function POST(request: Request) {
  const authSession = await getRequestAuthSession(request);
  const body = (await request.json().catch(() => ({}))) as NewsletterPayload;

  const email = (authSession?.user.email ?? body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const name = (authSession?.user.name ?? body.name ?? "").trim();
  const source = (body.source ?? "homepage").trim() || "homepage";

  const supabase = await createClientServer();
  const existing = await findExistingSubscription(authSession?.user.id ?? null, email);
  if (existing.error) {
    return NextResponse.json(
      { error: toStorageError("Unable to check drop list status.", existing.error) },
      { status: 500 },
    );
  }

  let data: NewsletterRow | null = null;
  let error: unknown = null;

  if (existing.row) {
    const updated = await supabase
      .from("newsletter_subscriptions")
      .update({
        email,
        user_id: authSession?.user.id ?? existing.row.user_id ?? null,
        name: name || null,
        source,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.row.id)
      .select("id, email, name, user_id, source, status, opted_in_at")
      .single();

    data = (updated.data as NewsletterRow | null) ?? null;
    error = updated.error;
  } else {
    const inserted = await supabase
      .from("newsletter_subscriptions")
      .insert({
        email,
        user_id: authSession?.user.id ?? null,
        name: name || null,
        source,
        status: "active",
      })
      .select("id, email, name, user_id, source, status, opted_in_at")
      .single();

    data = (inserted.data as NewsletterRow | null) ?? null;
    error = inserted.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: toStorageError("Unable to join the drop list.", error) },
      { status: 500 },
    );
  }

  const alreadySubscribed = existing.row?.status === "active";

  return NextResponse.json({
    ...buildSubscriptionResponse(data),
    message: alreadySubscribed ? "You are already subscribed to the drop list." : "You joined the drop list.",
  });
}

export async function DELETE(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClientServer();
  const email = (authSession.user.email ?? "").trim().toLowerCase();
  const existing = await findExistingSubscription(authSession.user.id, email);

  if (existing.error) {
    return NextResponse.json(
      { error: toStorageError("Unable to check drop list status.", existing.error) },
      { status: 500 },
    );
  }

  if (!existing.row) {
    return NextResponse.json({ error: "Drop list subscription not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("newsletter_subscriptions")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.row.id)
    .select("email, name, user_id, source, status, opted_in_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: toStorageError("Unable to leave the drop list.", error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ...buildSubscriptionResponse(data),
    message: "You left the drop list.",
  });
}