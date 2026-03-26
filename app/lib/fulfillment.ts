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
  mode: "mock";
  externalOrderId: string;
  trackingNumber: string;
  carrier: string;
  status: "submitted";
  createdAt: string;
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

export const createFulfillmentOrder = async (
  input: FulfillmentOrderInput,
): Promise<FulfillmentOrderResult> => {
  const mode = (process.env.FULFILLMENT_MODE ?? "mock").toLowerCase();

  if (mode !== "mock") {
    throw new Error("Only FULFILLMENT_MODE=mock is implemented in this project.");
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
