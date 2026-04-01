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
  userId?: string;
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
  userId?: string;
  orderRef: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  customer: PurchasedCustomer;
  items: FulfillmentItem[];
  fulfillment: FulfillmentOrderResult;
};

const ordersByPurchaseId = new Map<string, PurchasedOrder>();
const purchaseIdBySessionId = new Map<string, string>();
const purchaseIdsByUserId = new Map<string, Set<string>>();

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
    userId: input.userId,
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

  if (input.userId) {
    const userOrders = purchaseIdsByUserId.get(input.userId) ?? new Set<string>();
    userOrders.add(purchaseId);
    purchaseIdsByUserId.set(input.userId, userOrders);
  }

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

export const getPurchasedOrdersByUserId = (userId: string) => {
  const purchaseIds = purchaseIdsByUserId.get(userId);
  if (!purchaseIds || purchaseIds.size === 0) {
    return [];
  }

  return [...purchaseIds]
    .map((purchaseId) => ordersByPurchaseId.get(purchaseId))
    .filter((order): order is PurchasedOrder => Boolean(order))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
