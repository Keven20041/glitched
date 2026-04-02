import { NextResponse } from "next/server";
import {
  getPurchasedOrderForUserByPurchaseId,
  getPurchasedOrderForUserBySessionId,
} from "../../lib/orders";
import { getRequestAuthSession } from "../../lib/auth-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authSession = await getRequestAuthSession(request);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const purchaseId = url.searchParams.get("purchase_id");
  const sessionId = url.searchParams.get("session_id");

  if (!purchaseId && !sessionId) {
    return NextResponse.json(
      { error: "Provide either purchase_id or session_id." },
      { status: 400 },
    );
  }

  const order = purchaseId
    ? await getPurchasedOrderForUserByPurchaseId(purchaseId, authSession.user.id)
    : await getPurchasedOrderForUserBySessionId(sessionId ?? "", authSession.user.id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(order);
}
