import type { FulfillmentItem, FulfillmentOrderResult } from "./fulfillment";
import { createClientServer } from "../utils/supabase/server";

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

type PersistedOrderRow = {
  purchase_id: string;
  user_id: string;
  order_ref: string;
  stripe_session_id: string;
  payment_intent_id: string | null;
  status: string;
  created_at: string;
  customer: unknown;
  items: unknown;
  fulfillment: unknown;
};

const ordersByPurchaseId = new Map<string, PurchasedOrder>();
const purchaseIdBySessionId = new Map<string, string>();
const purchaseIdsByUserId = new Map<string, Set<string>>();

const buildPurchaseId = () => {
  return `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
};

const getOrderTotalAmountCents = (items: FulfillmentItem[]) => {
  return items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
};

const toPurchasedOrder = (row: PersistedOrderRow): PurchasedOrder => {
  return {
    purchaseId: row.purchase_id,
    userId: row.user_id,
    orderRef: row.order_ref,
    stripeSessionId: row.stripe_session_id,
    paymentIntentId: row.payment_intent_id ?? undefined,
    status: "paid",
    createdAt: row.created_at,
    customer: (row.customer ?? {}) as PurchasedCustomer,
    items: (row.items ?? []) as FulfillmentItem[],
    fulfillment: (row.fulfillment ?? {}) as FulfillmentOrderResult,
  };
};

const persistPurchasedOrder = async (order: PurchasedOrder) => {
  if (!order.userId) {
    return;
  }

  try {
    const supabase = await createClientServer();
    const { error } = await supabase.from("profile_purchases").upsert(
      {
        purchase_id: order.purchaseId,
        user_id: order.userId,
        order_ref: order.orderRef,
        stripe_session_id: order.stripeSessionId,
        payment_intent_id: order.paymentIntentId ?? null,
        status: order.status,
        created_at: order.createdAt,
        customer: order.customer,
        items: order.items,
        fulfillment: order.fulfillment,
        total_amount_cents: getOrderTotalAmountCents(order.items),
      },
      { onConflict: "stripe_session_id" },
    );

    if (error) {
      console.error("Unable to persist purchased order", error);
    }
  } catch (error) {
    console.error("Unable to persist purchased order", error);
  }
};

export const savePurchasedOrder = async (input: SavePurchasedOrderInput): Promise<PurchasedOrder> => {
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

  await persistPurchasedOrder(created);

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

export const getPersistedPurchasedOrderByPurchaseId = async (
  purchaseId: string,
  userId: string,
) => {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("profile_purchases")
    .select(
      "purchase_id, user_id, order_ref, stripe_session_id, payment_intent_id, status, created_at, customer, items, fulfillment",
    )
    .eq("purchase_id", purchaseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toPurchasedOrder(data as PersistedOrderRow);
};

export const getPersistedPurchasedOrderBySessionId = async (
  sessionId: string,
  userId: string,
) => {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("profile_purchases")
    .select(
      "purchase_id, user_id, order_ref, stripe_session_id, payment_intent_id, status, created_at, customer, items, fulfillment",
    )
    .eq("stripe_session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toPurchasedOrder(data as PersistedOrderRow);
};

export const getPersistedPurchasedOrdersByUserId = async (userId: string) => {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("profile_purchases")
    .select(
      "purchase_id, user_id, order_ref, stripe_session_id, payment_intent_id, status, created_at, customer, items, fulfillment",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => toPurchasedOrder(row as PersistedOrderRow));
};

export const getPurchasedOrdersForUser = async (userId: string) => {
  const persistedOrders = await getPersistedPurchasedOrdersByUserId(userId);
  const cachedOrders = getPurchasedOrdersByUserId(userId);

  if (cachedOrders.length === 0) {
    return persistedOrders;
  }

  const byPurchaseId = new Map<string, PurchasedOrder>();
  for (const order of persistedOrders) {
    byPurchaseId.set(order.purchaseId, order);
  }

  for (const order of cachedOrders) {
    if (!byPurchaseId.has(order.purchaseId)) {
      byPurchaseId.set(order.purchaseId, order);
    }
  }

  return [...byPurchaseId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getPurchasedOrderForUserByPurchaseId = async (purchaseId: string, userId: string) => {
  const persisted = await getPersistedPurchasedOrderByPurchaseId(purchaseId, userId);
  if (persisted) {
    return persisted;
  }

  const cached = getPurchasedOrderByPurchaseId(purchaseId);
  if (!cached || cached.userId !== userId) {
    return null;
  }

  return cached;
};

export const getPurchasedOrderForUserBySessionId = async (sessionId: string, userId: string) => {
  const persisted = await getPersistedPurchasedOrderBySessionId(sessionId, userId);
  if (persisted) {
    return persisted;
  }

  const cached = getPurchasedOrderBySessionId(sessionId);
  if (!cached || cached.userId !== userId) {
    return null;
  }

  return cached;
};
