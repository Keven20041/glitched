This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mock Fulfillment (No Third-Party Required)

You can test a payment -> fulfillment flow locally without connecting a shipping provider.

Set these environment variables in your local `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FULFILLMENT_MODE=mock
```

Run the app:

```bash
npm run dev
```

In a separate terminal, forward Stripe webhooks to the local webhook route:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

When a checkout completes, the webhook will:

- verify the Stripe signature
- read paid session and line items
- submit a mock fulfillment order
- log a fake external order id and tracking number

Relevant routes and modules:

- `app/api/checkout/session/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/orders/route.ts`
- `app/lib/fulfillment.ts`
- `app/lib/orders.ts`

After payment, a tracked `purchaseId` is created and linked to the customer details from checkout/session data.

Lookup endpoints:

- `GET /api/orders?session_id=cs_test_...`
- `GET /api/orders?purchase_id=ord_...`

## EasyPost Fulfillment

Use EasyPost when you want real labels and tracking without running your own warehouse software.

Add these environment variables to your local `.env.local` or hosting dashboard:

```bash
FULFILLMENT_MODE=easypost
EASYPOST_API_KEY=ep_test_or_live_key_here
FULFILLMENT_FROM_NAME=Your Store
FULFILLMENT_FROM_LINE1=123 Warehouse St
FULFILLMENT_FROM_CITY=Your City
FULFILLMENT_FROM_STATE=CA
FULFILLMENT_FROM_ZIP=90001
FULFILLMENT_FROM_COUNTRY=US
```

Then restart the app and place a Stripe test order. When the Stripe webhook fires, the app will send the paid order to EasyPost, store the tracking data, and show it on the success page and in the account orders page.

Notes:

- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` pointed at your Stripe test account while testing.
- EasyPost needs a valid sender address even in test mode.
- If EasyPost returns a label URL, the app will expose a Track Package link in the UI.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
