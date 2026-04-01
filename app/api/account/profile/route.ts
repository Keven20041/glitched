import { NextResponse } from "next/server";
import { getRequestAuthSession } from "@/app/lib/auth-session";
import { createClientServer } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("profile_preferences")
    .select("address, city")
    .eq("user_id", authSession.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load profile preferences." }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: authSession.user.id,
      name: authSession.user.name ?? "",
      email: authSession.user.email ?? "",
    },
    preferences: {
      address: data?.address ?? "",
      city: data?.city ?? "",
    },
  });
}

export async function POST(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{ address: string; city: string }>;

  const supabase = await createClientServer();
  const payload = {
    user_id: authSession.user.id,
    address: body.address ?? "",
    city: body.city ?? "",
  };

  const { data, error } = await supabase
    .from("profile_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("address, city")
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to save profile preferences." }, { status: 500 });
  }

  return NextResponse.json({
    preferences: {
      address: data.address ?? "",
      city: data.city ?? "",
    },
  });
}
