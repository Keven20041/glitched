import { NextResponse } from "next/server";
import { getRequestAuthSession } from "../../../lib/auth-session";
import { getPurchasedOrdersForUser } from "../../../lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orders = await getPurchasedOrdersForUser(authSession.user.id);
  return NextResponse.json({ orders });
}
