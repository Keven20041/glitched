import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createFulfillmentOrder } from "../../../lib/fulfillment";
import { savePurchasedOrder } from "../../../lib/orders";

export const runtime = "nodejs";

const processedEventIds = new Set<string>();
const processedSessionIds = new Set<string>();

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
};

const toCurrencyAmount = (amount: number | null | undefined) => {
  if (!amount || amount < 0) {
    return 0;
  }

  return amount;
};

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (processedEventIds.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  processedEventIds.add(event.id);

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.id) {
    return NextResponse.json({ error: "Missing checkout session id." }, { status: 400 });
  }

  if (processedSessionIds.has(session.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "payment_not_paid" });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  const customerDetails = session.customer_details;
  const shipping = (
    session as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string | null;
        address?: {
          line1?: string | null;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        } | null;
      } | null;
    }
  ).shipping_details;
  const address = customerDetails?.address ?? shipping?.address;

  const orderRef =
    session.client_reference_id ??
    session.metadata?.orderRef ??
    `session-${session.id}`;

  const items = lineItems.data.map((item) => ({
    sku: item.description ?? "sku-unknown",
    name: item.description ?? "Item",
    quantity: item.quantity ?? 1,
    unitAmount: toCurrencyAmount(item.price?.unit_amount),
    currency: item.currency ?? "usd",
  }));

  const fulfillment = await createFulfillmentOrder({
    orderRef,
    stripeSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    address: {
      name: customerDetails?.name ?? shipping?.name ?? session.metadata?.fullName ?? "Customer",
      email: customerDetails?.email ?? undefined,
      phone: customerDetails?.phone ?? undefined,
      line1: address?.line1 ?? session.metadata?.address ?? undefined,
      line2: address?.line2 ?? undefined,
      city: address?.city ?? session.metadata?.city ?? undefined,
      state: address?.state ?? undefined,
      postalCode: address?.postal_code ?? undefined,
      country: address?.country ?? undefined,
    },
    items,
  });

  const purchasedOrder = savePurchasedOrder({
    orderRef,
    stripeSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    customer: {
      fullName: customerDetails?.name ?? shipping?.name ?? session.metadata?.fullName ?? "Customer",
      email: customerDetails?.email ?? undefined,
      phone: customerDetails?.phone ?? undefined,
      address:
        address?.line1 ??
        session.metadata?.address ??
        undefined,
      city: address?.city ?? session.metadata?.city ?? undefined,
      state: address?.state ?? undefined,
      postalCode: address?.postal_code ?? undefined,
      country: address?.country ?? undefined,
    },
    items,
    fulfillment,
  });

  processedSessionIds.add(session.id);

  return NextResponse.json({
    received: true,
    orderRef,
    purchaseId: purchasedOrder.purchaseId,
    fulfillment,
  });
}
