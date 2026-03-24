"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cartUpdatedEventName,
  getCartItems,
  updateCartItemQuantity,
  type CartItem,
} from "../lib/cart";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => getCartItems());

  useEffect(() => {
    const sync = () => {
      setItems(getCartItems());
    };

    window.addEventListener(cartUpdatedEventName, sync);

    return () => {
      window.removeEventListener(cartUpdatedEventName, sync);
    };
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Shopping cart">
        <header className="checkout-header">
          <p>GLITCHED CART</p>
          <h1>Review Your Gear</h1>
          <p>{items.length} item(s) ready for checkout.</p>
        </header>

        {items.length === 0 ? (
          <section className="checkout-summary" aria-label="Empty cart">
            <h2>Your cart is empty</h2>
            <p>Add products from the storefront to begin checkout.</p>
            <Link href="/" className="checkout-link">
              Continue Shopping
            </Link>
          </section>
        ) : (
          <>
            <section className="cart-list" aria-label="Cart items">
              {items.map((item) => (
                <article key={item.id} className="cart-item">
                  <div>
                    <h2>{item.name}</h2>
                    <p>{currency.format(item.price)} each</p>
                  </div>

                  <div className="cart-item-controls">
                    <button type="button" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <strong>{currency.format(item.price * item.quantity)}</strong>
                </article>
              ))}
            </section>

            <section className="checkout-summary" aria-label="Order summary">
              <h2>Order Summary</h2>
              <div className="checkout-row">
                <span>Subtotal</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              <div className="checkout-row">
                <span>Shipping</span>
                <strong>Calculated at checkout</strong>
              </div>
              <Link href="/checkout" className="checkout-link">
                Proceed To Checkout
              </Link>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
