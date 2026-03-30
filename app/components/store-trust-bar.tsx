type StoreTrustBarProps = {
  compact?: boolean;
};

export default function StoreTrustBar({ compact = false }: StoreTrustBarProps) {
  return (
    <section className={`trust-bar ${compact ? "is-compact" : ""}`} aria-label="Delivery and trust highlights">
      <article>
        <h3>Fast Dispatch</h3>
        <p>Orders before 2 PM ship same day from our US warehouse.</p>
      </article>
      <article>
        <h3>30-Day Returns</h3>
        <p>Try your setup risk-free with hassle-free returns.</p>
      </article>
      <article>
        <h3>Secure Checkout</h3>
        <p>Stripe encrypted payment with full transaction protection.</p>
      </article>
      <article>
        <h3>2-Year Coverage</h3>
        <p>Extended warranty support on selected accessories.</p>
      </article>
    </section>
  );
}
