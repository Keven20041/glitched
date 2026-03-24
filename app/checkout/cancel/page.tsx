import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Payment cancelled">
        <header className="checkout-header">
          <p>CHECKOUT CANCELLED</p>
          <h1>No charge was made</h1>
          <p>You can return to checkout any time to complete your purchase.</p>
        </header>

        <section className="checkout-summary">
          <Link href="/checkout" className="checkout-link">
            Back To Checkout
          </Link>
          <Link href="/cart" className="checkout-link">
            Review Cart
          </Link>
        </section>
      </section>
    </main>
  );
}
