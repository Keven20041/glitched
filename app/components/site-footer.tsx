import Link from "next/link";

function NewsletterForm() {
  return (
    <form className="newsletter-form" suppressHydrationWarning>
      <input
        type="email"
        placeholder="Enter your email"
        className="newsletter-input"
        required
        suppressHydrationWarning
      />
      <button type="submit" className="newsletter-button" suppressHydrationWarning>
        Subscribe
      </button>
    </form>
  );
}

export default function SiteFooter() {
  const currentYear = 2026;

  const categories = [
    { label: "Headsets", href: "/products?category=headsets" },
    { label: "Keyboards", href: "/products?category=keyboards" },
    { label: "Mice", href: "/products?category=mice" },
    { label: "Mousepads", href: "/products?category=mousepads" },
    { label: "Streaming Gear", href: "/products?category=streaming" },
    { label: "Power Docks", href: "/products?category=power-docks" },
  ];

  const footerLinks = [
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Shipping & Returns", href: "/shipping-returns" },
        { label: "Contact Support", href: "/support" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "About Glitched", href: "/about" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Categories Section */}
        <div className="footer-section">
          <h3 className="footer-heading">Shop</h3>
          <ul className="footer-links">
            {categories.map((category) => (
              <li key={category.href}>
                <Link href={category.href}>{category.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        {footerLinks.map((section) => (
          <div key={section.title} className="footer-section">
            <h3 className="footer-heading">{section.title}</h3>
            <ul className="footer-links">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter Section */}
        <div className="footer-section footer-newsletter">
          <h3 className="footer-heading">Stay Updated</h3>
          <p className="newsletter-desc">Get the latest on new tech gear and exclusive drops.</p>
          <NewsletterForm />
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Glitched. All rights reserved.</p>
        <p className="footer-payment">Secure payments powered by Stripe</p>
      </div>
    </footer>
  );
}
