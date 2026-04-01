import { NextResponse } from "next/server";
import { getRequestAuthSession } from "../../../lib/auth-session";
import { getPurchasedOrdersByUserId } from "../../../lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orders = getPurchasedOrdersByUserId(authSession.user.id);
  return NextResponse.json({ orders });
}
