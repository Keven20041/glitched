import type { FulfillmentItem, FulfillmentOrderResult } from "./fulfillment";

export type PurchasedCustomer = {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type PurchasedOrder = {
  purchaseId: string;
  orderRef: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  status: "paid";
  createdAt: string;
  customer: PurchasedCustomer;
  items: FulfillmentItem[];
  fulfillment: FulfillmentOrderResult;
};

type SavePurchasedOrderInput = {
  orderRef: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  customer: PurchasedCustomer;
  items: FulfillmentItem[];
  fulfillment: FulfillmentOrderResult;
};

const ordersByPurchaseId = new Map<string, PurchasedOrder>();
const purchaseIdBySessionId = new Map<string, string>();

const buildPurchaseId = () => {
  return `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
};

export const savePurchasedOrder = (input: SavePurchasedOrderInput): PurchasedOrder => {
  const existingPurchaseId = purchaseIdBySessionId.get(input.stripeSessionId);
  if (existingPurchaseId) {
    const existing = ordersByPurchaseId.get(existingPurchaseId);
    if (existing) {
      return existing;
    }
  }

  const purchaseId = buildPurchaseId();
  const created: PurchasedOrder = {
    purchaseId,
    orderRef: input.orderRef,
    stripeSessionId: input.stripeSessionId,
    paymentIntentId: input.paymentIntentId,
    status: "paid",
    createdAt: new Date().toISOString(),
    customer: input.customer,
    items: input.items,
    fulfillment: input.fulfillment,
  };

  ordersByPurchaseId.set(purchaseId, created);
  purchaseIdBySessionId.set(input.stripeSessionId, purchaseId);

  return created;
};

export const getPurchasedOrderByPurchaseId = (purchaseId: string) => {
  return ordersByPurchaseId.get(purchaseId) ?? null;
};

export const getPurchasedOrderBySessionId = (sessionId: string) => {
  const purchaseId = purchaseIdBySessionId.get(sessionId);
  if (!purchaseId) {
    return null;
  }

  return getPurchasedOrderByPurchaseId(purchaseId);
};
