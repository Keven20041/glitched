export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const CART_STORAGE_KEY = "glitched-cart";
const CART_UPDATED_EVENT = "glitched-cart-updated";
const CART_ITEM_ADDED_EVENT = "glitched-cart-item-added";

export type CartItemAddedEventDetail = {
  name: string;
  quantity: number;
};

const isBrowser = () => typeof window !== "undefined";

const safeParseCart = (raw: string | null): CartItem[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

const notifyCartItemAdded = (item: CartItem) => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<CartItemAddedEventDetail>(CART_ITEM_ADDED_EVENT, {
      detail: {
        name: item.name,
        quantity: item.quantity,
      },
    }),
  );
};

export const getCartItems = (): CartItem[] => {
  if (!isBrowser()) {
    return [];
  }

  return safeParseCart(window.localStorage.getItem(CART_STORAGE_KEY));
};

export const getCartCount = (): number => {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
};

export const getCartSubtotal = (): number => {
  return getCartItems().reduce((total, item) => total + item.price * item.quantity, 0);
};

export const addCartItem = (incoming: CartItem) => {
  const existing = getCartItems();
  const match = existing.find((item) => item.id === incoming.id);

  if (match) {
    const updated = existing.map((item) =>
      item.id === incoming.id ? { ...item, quantity: item.quantity + incoming.quantity } : item,
    );
    writeCart(updated);
    notifyCartItemAdded(incoming);
    return;
  }

  writeCart([...existing, incoming]);
  notifyCartItemAdded(incoming);
};

export const updateCartItemQuantity = (id: string, quantity: number) => {
  const existing = getCartItems();
  const normalized = Math.max(0, Math.floor(quantity));

  if (normalized === 0) {
    writeCart(existing.filter((item) => item.id !== id));
    return;
  }

  const updated = existing.map((item) => (item.id === id ? { ...item, quantity: normalized } : item));
  writeCart(updated);
};

export const clearCart = () => {
  writeCart([]);
};

export const cartUpdatedEventName = CART_UPDATED_EVENT;
export const cartItemAddedEventName = CART_ITEM_ADDED_EVENT;
