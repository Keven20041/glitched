import { NextResponse } from "next/server";
import Stripe from "stripe";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutPayload = {
  items: CheckoutItem[];
  customer: {
    fullName: string;
    email: string;
    address: string;
    city: string;
  };
};

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
};

export async function POST(request: Request) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as CheckoutPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const lineItems = body.items
      .filter((item) => item.quantity > 0 && item.price > 0)
      .map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            metadata: {
              productId: item.id,
            },
          },
        },
      }));

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "No valid cart items found." }, { status: 400 });
    }

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: body.customer.email,
      billing_address_collection: "required",
      metadata: {
        fullName: body.customer.fullName,
        address: body.customer.address,
        city: body.customer.city,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session URL is unavailable." }, { status: 500 });
    }

    return NextResponse.json({ id: session.id, url: session.url });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }
}
