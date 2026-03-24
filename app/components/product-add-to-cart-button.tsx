"use client";

import { addCartItem } from "../lib/cart";

type ProductAddToCartButtonProps = {
  id: string;
  name: string;
  price: string;
};

export default function ProductAddToCartButton({ id, name, price }: ProductAddToCartButtonProps) {
  return (
    <button
      type="button"
      className="checkout-link"
      onClick={() => {
        addCartItem({
          id,
          name,
          price: Number(price.replace("$", "")),
          quantity: 1,
        });
      }}
    >
      Add To Cart
    </button>
  );
}
