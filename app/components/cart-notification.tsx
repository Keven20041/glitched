"use client";

import { useEffect, useState } from "react";
import { cartItemAddedEventName, type CartItemAddedEventDetail } from "../lib/cart";

const HIDE_DELAY_MS = 1800;

export default function CartNotification() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onCartItemAdded = (event: Event) => {
      const customEvent = event as CustomEvent<CartItemAddedEventDetail>;
      const productName = customEvent.detail?.name?.trim();

      if (!productName) {
        return;
      }

      setMessage(`${productName} has been added to the cart`);
    };

    window.addEventListener(cartItemAddedEventName, onCartItemAdded);

    return () => {
      window.removeEventListener(cartItemAddedEventName, onCartItemAdded);
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
    }, HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [message]);

  return (
    <p className={`cart-toast ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
      {message || "Item has been added to the cart"}
    </p>
  );
}
