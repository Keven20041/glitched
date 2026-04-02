import { createClientServer } from "../utils/supabase/server";

export type FulfillmentAddress = {
  name: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type FulfillmentItem = {
  sku: string;
  name: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

export type FulfillmentOrderInput = {
  orderRef: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  address: FulfillmentAddress;
  items: FulfillmentItem[];
};

export type FulfillmentOrderResult = {
  mode: "mock" | "easypost" | "shipbob";
  externalOrderId: string;
  trackingNumber: string;
  carrier: string;
  status: "submitted" | "processing" | "shipped" | "delivered";
  createdAt: string;
  label_download_url?: string;
};

const mockOrders = new Map<string, FulfillmentOrderResult>();

const buildMockResult = (orderRef: string): FulfillmentOrderResult => {
  const timestamp = Date.now().toString(36).toUpperCase();

  return {
    mode: "mock",
    externalOrderId: `mock_ship_${orderRef.slice(0, 8)}_${timestamp}`,
    trackingNumber: `MOCK-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    carrier: "Mock Carrier",
    status: "submitted",
    createdAt: new Date().toISOString(),
  };
};

const createEasyPostShipment = async (
  input: FulfillmentOrderInput,
): Promise<FulfillmentOrderResult> => {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    throw new Error("EASYPOST_API_KEY not configured");
  }

  const response = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      shipment: {
        to_address: {
          name: input.address.name,
          street1: input.address.line1,
          street2: input.address.line2,
          city: input.address.city,
          state: input.address.state,
          zip: input.address.postalCode,
          country: input.address.country || "US",
          email: input.address.email,
          phone: input.address.phone,
        },
        from_address: {
          name: process.env.FULFILLMENT_FROM_NAME || "Your Store",
          street1: process.env.FULFILLMENT_FROM_LINE1,
          city: process.env.FULFILLMENT_FROM_CITY,
          state: process.env.FULFILLMENT_FROM_STATE,
          zip: process.env.FULFILLMENT_FROM_ZIP,
          country: process.env.FULFILLMENT_FROM_COUNTRY || "US",
        },
        parcels: [
          {
            length: 10,
            width: 10,
            height: 10,
            weight: 5,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`EasyPost error: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as {
    id?: string;
    postage_label?: { label_download?: { href?: string } };
    rates?: Array<{ id?: string; service?: string; rate?: string; carrier?: string }>;
  };

  const trackingNumber = data.id ?? `EP-${Date.now()}`;
  const labelUrl = data.postage_label?.label_download?.href;

  return {
    mode: "easypost",
    externalOrderId: data.id || `order_${input.orderRef}`,
    trackingNumber,
    carrier: "USPS/UPS/FedEx",
    status: "submitted",
    createdAt: new Date().toISOString(),
    label_download_url: labelUrl,
  };
};

const createShipBobShipment = async (
  input: FulfillmentOrderInput,
): Promise<FulfillmentOrderResult> => {
  const apiKey = process.env.SHIPBOB_API_KEY;
  if (!apiKey) {
    throw new Error("SHIPBOB_API_KEY not configured");
  }

  const response = await fetch("https://api.shipbob.com/1.0/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      recipient: {
        name: input.address.name,
        address: {
          address1: input.address.line1,
          address2: input.address.line2,
          city: input.address.city,
          state: input.address.state,
          zip_code: input.address.postalCode,
          country_code: input.address.country || "US",
        },
        email: input.address.email,
        phone_number: input.address.phone,
      },
      items: input.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
      reference_id: input.orderRef,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ShipBob error: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as {
    order_id?: number;
    tracking_number?: string;
  };

  const trackingNumber = data.tracking_number || `SB-${data.order_id || Date.now()}`;

  return {
    mode: "shipbob",
    externalOrderId: `${data.order_id || input.orderRef}`,
    trackingNumber,
    carrier: "ShipBob",
    status: "submitted",
    createdAt: new Date().toISOString(),
  };
};

export const createFulfillmentOrder = async (
  input: FulfillmentOrderInput,
): Promise<FulfillmentOrderResult> => {
  const mode = (process.env.FULFILLMENT_MODE ?? "mock").toLowerCase();

  if (mode === "easypost") {
    return createEasyPostShipment(input);
  }

  if (mode === "shipbob") {
    return createShipBobShipment(input);
  }

  if (mode !== "mock") {
    throw new Error(
      `Unknown FULFILLMENT_MODE=${mode}. Use: mock, easypost, or shipbob`,
    );
  }

  const existing = mockOrders.get(input.orderRef);
  if (existing) {
    return existing;
  }

  const created = buildMockResult(input.orderRef);
  mockOrders.set(input.orderRef, created);

  console.log("[fulfillment:mock] order submitted", {
    orderRef: input.orderRef,
    stripeSessionId: input.stripeSessionId,
    itemCount: input.items.length,
    recipient: input.address.name,
    externalOrderId: created.externalOrderId,
    trackingNumber: created.trackingNumber,
  });

  return created;
};

export const getMockFulfillmentOrder = (orderRef: string) => {
  return mockOrders.get(orderRef) ?? null;
};

export const persistFulfillmentToDatabase = async (
  purchaseId: string,
  fulfillment: FulfillmentOrderResult,
) => {
  const supabase = await createClientServer();

  const { error } = await supabase.from("shipments").insert({
    id: `ship_${crypto.randomUUID().slice(0, 16)}`,
    purchase_id: purchaseId,
    external_shipment_id: fulfillment.externalOrderId,
    tracking_number: fulfillment.trackingNumber,
    carrier: fulfillment.carrier,
    status: fulfillment.status === "submitted" ? "pending" : fulfillment.status,
    carrier_response: { mode: fulfillment.mode },
  });

  if (error) {
    console.error("Error persisting fulfillment:", error);
  }
};

