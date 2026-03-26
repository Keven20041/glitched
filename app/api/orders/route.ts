import { NextResponse } from "next/server";
import {
  getPurchasedOrderByPurchaseId,
  getPurchasedOrderBySessionId,
} from "../../lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
    ? getPurchasedOrderByPurchaseId(purchaseId)
    : getPurchasedOrderBySessionId(sessionId ?? "");

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(order);
}
