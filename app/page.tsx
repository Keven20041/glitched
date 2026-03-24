"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Product = {
  name: string;
  category: string;
  type: string;
  tag: string;
  price: string;
  description: string;
  meter: string;
};

const navMenus = [
  {
    title: "Shop",
    columns: [
      {
        heading: "Categories",
        links: ["Mice", "Keyboards", "Audio", "Power + Docks"],
      },
      {
        heading: "Popular",
        links: ["Specter Series", "Vector Boards", "Creator Essentials", "Desk Setup Kits"],
      },
    ],
  },
  {
    title: "Story",
    columns: [
      {
        heading: "Inside Glitched",
        links: ["Design Lab", "Latency Testing", "Material Experiments", "Build Process"],
      },
      {
        heading: "Community",
        links: ["Creator Setups", "Player Spotlights", "Patch Notes", "Events"],
      },
    ],
  },
  {
    title: "Guides",
    columns: [
      {
        heading: "How-To",
        links: ["Pick The Right Mouse", "Keyboard Switch Guide", "Audio EQ Starter", "Cable Management"],
      },
      {
        heading: "Support",
        links: ["Shipping", "Returns", "Warranty", "FAQ"],
      },
    ],
  },
];

const heroWords = ["Distorted", "Precise", "Overclocked"];
const tickerItems = [
  "LIVE STOCK STATUS: ONLINE",
  "FREE SHIPPING OVER $120",
  "SEASON 04 TECH DROP",
  "JOIN GLITCHED+ NEWSLETTER",
  "LOW-LATENCY PERFORMANCE GEAR",
];

const products: Product[] = [
  {
    name: "Specter 8K Mouse",
    category: "Mice",
    type: "Wireless",
    tag: "Best Seller",
    price: "$79",
    description: "Ultra-light shell, 8K polling, and magnetic side grips for ranked play.",
    meter: "89%",
  },
  {
    name: "Cipher Mini Mouse",
    category: "Mice",
    type: "Claw Grip",
    tag: "New",
    price: "$69",
    description: "Compact shell with optical switches and low-friction skates for fast flicks.",
    meter: "77%",
  },
  {
    name: "Axiom Ergo Mouse",
    category: "Mice",
    type: "Ergonomic",
    tag: "Work + Play",
    price: "$89",
    description: "Split-angle ergonomic form with programmable side dial and silent clicks.",
    meter: "71%",
  },
  {
    name: "Vector 75 Keyboard",
    category: "Keyboards",
    type: "75%",
    tag: "Drop 03",
    price: "$149",
    description: "Hot-swappable 75% board with gasket mount and low-latency wireless mode.",
    meter: "72%",
  },
  {
    name: "Nova TKL Keyboard",
    category: "Keyboards",
    type: "TKL",
    tag: "Tournament",
    price: "$129",
    description: "Tenkeyless aluminum board tuned for rapid actuation and stable key feel.",
    meter: "68%",
  },
  {
    name: "Pulse 60 Keyboard",
    category: "Keyboards",
    type: "60%",
    tag: "Compact",
    price: "$119",
    description: "Portable 60% layout with per-key RGB and triple-device Bluetooth pairing.",
    meter: "64%",
  },
  {
    name: "GhostLoop Earbuds",
    category: "Audio",
    type: "Earbuds",
    tag: "New",
    price: "$109",
    description: "Gaming-tuned ANC earbuds with 35-hour battery and dual device pairing.",
    meter: "64%",
  },
  {
    name: "EchoFrame Headset",
    category: "Audio",
    type: "Headset",
    tag: "Spatial",
    price: "$139",
    description: "Closed-back headset with detachable boom mic and low-latency 2.4G dongle.",
    meter: "73%",
  },
  {
    name: "VibeMic USB",
    category: "Audio",
    type: "Microphone",
    tag: "Creator",
    price: "$99",
    description: "USB-C condenser mic with tap mute, gain dial, and cardioid recording mode.",
    meter: "69%",
  },
  {
    name: "FluxDock 7-in-1",
    category: "Power + Docks",
    type: "Dock",
    tag: "Creator Pick",
    price: "$89",
    description: "USB-C dock with HDMI 4K60, ethernet, PD passthrough, and SD transfer.",
    meter: "81%",
  },
  {
    name: "VoltCore 20K",
    category: "Power + Docks",
    type: "Power Bank",
    tag: "Fast Charge",
    price: "$74",
    description: "20,000mAh battery with dual USB-C PD outputs and onboard power display.",
    meter: "75%",
  },
  {
    name: "ArcCharge GaN 120W",
    category: "Power + Docks",
    type: "Wall Charger",
    tag: "GaN",
    price: "$65",
    description: "Compact multi-port GaN charger for laptop, tablet, and phone fast charging.",
    meter: "80%",
  },
  {
    name: "Glide XL Mousepad",
    category: "Mousepads",
    type: "Control",
    tag: "Desk Mat",
    price: "$35",
    description: "Extended control surface with stitched edges and anti-slip natural rubber base.",
    meter: "66%",
  },
  {
    name: "Slipstream Speedpad",
    category: "Mousepads",
    type: "Speed",
    tag: "Esports",
    price: "$39",
    description: "Low-friction speed surface tuned for low-DPI tracking and rapid flick shots.",
    meter: "63%",
  },
  {
    name: "Orbit Cam 4K",
    category: "Streaming",
    type: "Webcam",
    tag: "Streaming",
    price: "$119",
    description: "4K webcam with auto-light correction and magnetic privacy cover.",
    meter: "70%",
  },
  {
    name: "Beam Key Light",
    category: "Streaming",
    type: "Lighting",
    tag: "Studio",
    price: "$89",
    description: "Edge-lit key light with app presets for warm, neutral, and cool scenes.",
    meter: "67%",
  },
];

const shopCategories = ["All", "Mice", "Keyboards", "Audio", "Power + Docks", "Mousepads", "Streaming"];

const parsePrice = (price: string) => Number(price.replace("$", ""));

export default function Home() {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [featuredProduct, setFeaturedProduct] = useState(0);
  const [showQuickLinks, setShowQuickLinks] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [cartCount, setCartCount] = useState(0);
  const [lastAdded, setLastAdded] = useState("");

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFeaturedProduct(0);
  };

  const handleAddToCart = (name: string) => {
    setCartCount((prev) => prev + 1);
    setLastAdded(name);
  };

  const filteredProducts = useMemo(() => {
    const byCategory =
      selectedCategory === "All" ? products : products.filter((item) => item.category === selectedCategory);

    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return byCategory;
    }

    return byCategory.filter((item) => {
      const searchable = `${item.name} ${item.description} ${item.type} ${item.tag} ${item.category}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [searchTerm, selectedCategory]);

  const sortedProducts = useMemo(() => {
    if (sortBy === "featured") {
      return filteredProducts;
    }

    const sorted = [...filteredProducts];
    if (sortBy === "price-low") {
      sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      return sorted;
    }

    if (sortBy === "price-high") {
      sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      return sorted;
    }

    sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filteredProducts, sortBy]);

  const showcaseProducts = sortedProducts.slice(0, 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showcaseProducts.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setFeaturedProduct((prev) => (prev + 1) % showcaseProducts.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [showcaseProducts.length]);

  useEffect(() => {
    if (!lastAdded) {
      return;
    }

    const timeout = setTimeout(() => {
      setLastAdded("");
    }, 1700);

    return () => clearTimeout(timeout);
  }, [lastAdded]);

  const activeMenu = openMenuIndex !== null ? navMenus[openMenuIndex] : null;

  return (
    <main className="glitched-page">
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((group) => (
            <div className="ticker-group" key={`ticker-group-${group}`}>
              {tickerItems.map((item) => (
                <span key={`${group}-${item}`}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="hero" aria-label="Glitched accessories store">
        <header className="brand-row">
          <Image
  src="/glitched-logo2.png"
  alt="Glitched logo"
  width={160}
  height={60}
  priority
  className="brand-logo"
/>
          <nav className="main-nav" aria-label="Main navigation" onMouseLeave={() => setOpenMenuIndex(null)}>
            {navMenus.map((menu, index) => (
              <button
                key={menu.title}
                type="button"
                className={`main-link ${openMenuIndex === index ? "active" : ""}`}
                aria-expanded={openMenuIndex === index}
                aria-haspopup="true"
                onMouseEnter={() => setOpenMenuIndex(index)}
                onFocus={() => setOpenMenuIndex(index)}
                onClick={() => setOpenMenuIndex((prev) => (prev === index ? null : index))}
              >
                {menu.title}
              </button>
            ))}
            <button type="button" className="utility-link" aria-label="Search">
              Search
            </button>
            <button type="button" className="utility-link" aria-label="Cart">
              Cart <span className="cart-count">{cartCount}</span>
            </button>

            {activeMenu && (
              <div className="mega-menu" role="menu" aria-label={`${activeMenu.title} submenu`}>
                {activeMenu.columns.map((column) => (
                  <section key={column.heading} className="mega-column">
                    <h3>{column.heading}</h3>
                    <ul>
                      {column.links.map((link) => (
                        <li key={link}>
                          <a href="#">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </nav>
        </header>

        {showQuickLinks && (
          <aside className="floating-card" aria-label="Quick links">
            <button
              type="button"
              className="close-float"
              aria-label="Close quick links"
              onClick={() => setShowQuickLinks(false)}
            >
              x
            </button>
            <h2>Build Your Battle Station.</h2>
            <p>High-performance desk gear engineered for speed, focus, and late-night grind.</p>
            <button type="button" onClick={() => handleCategoryChange("Keyboards")}>Shop Keyboards</button>
            <button type="button" onClick={() => handleCategoryChange("Mice")}>Shop Mice</button>
            <button type="button" onClick={() => handleCategoryChange("Audio")}>Audio + ANC</button>
            <button type="button" onClick={() => handleCategoryChange("Power + Docks")}>Power + Docks</button>
          </aside>
        )}

        <button type="button" className="vertical-newsletter">
          JOIN THE DROP LIST
        </button>

        <div className="hero-copy">
          <h1>
            Tech Accessories.
            <span className="rotating-word"> {heroWords[heroWordIndex]}</span>
            <br />
            Perfectly.
          </h1>
          <p>Low-latency gear for creators, grinders, and all-night sessions.</p>
          <div className="hero-cta-row">
            <button type="button">Shop The Drop</button>
            <button type="button" className="ghost">
              View Setup Kits
            </button>
          </div>
          <ul className="pulse-stats" aria-label="Live metrics">
            <li>12.4ms Avg Latency</li>
            <li>240Hz Polling Profiles</li>
            <li>1,920 Setups Shared</li>
          </ul>
        </div>

        <section className="product-strip" aria-label="Featured products">
          {showcaseProducts.map((item, index) => (
            <article
              key={`${item.name}-featured`}
              className={`product-card ${featuredProduct === index ? "is-featured" : ""}`}
              onMouseEnter={() => setFeaturedProduct(index)}
            >
              <p className="tag">{item.tag}</p>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="meter" aria-hidden="true">
                <span style={{ width: item.meter }} />
              </div>
              <div className="product-row">
                <strong>{item.price}</strong>
                <button type="button" onClick={() => handleAddToCart(item.name)}>
                  Add
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="catalog-section" aria-label="Tech accessory catalog">
          <header className="catalog-header">
            <h2>Browse By Gear Type</h2>
            <p>Click a category to view every matching item in the catalog.</p>

            <div className="catalog-tools" aria-label="Catalog filters">
              <label className="catalog-field">
                <span>Search</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, tag, or type"
                />
              </label>

              <label className="catalog-field compact">
                <span>Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low To High</option>
                  <option value="price-high">Price: High To Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </label>
            </div>
          </header>

          <div className="category-pills" role="tablist" aria-label="Shop categories">
            {shopCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`category-pill ${selectedCategory === category ? "active" : ""}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <p className="results-label">
            Showing {sortedProducts.length} item{sortedProducts.length === 1 ? "" : "s"} in {selectedCategory}
            {searchTerm ? ` matching "${searchTerm}"` : ""}
          </p>

          <div className="catalog-grid">
            {sortedProducts.map((item) => (
              <article key={item.name} className="catalog-card">
                <p className="catalog-meta">
                  <span>{item.category}</span>
                  <span>{item.type}</span>
                </p>
                <h3>{item.name}</h3>
                <p className="catalog-description">{item.description}</p>
                <div className="catalog-row">
                  <strong>{item.price}</strong>
                  <button type="button" onClick={() => handleAddToCart(item.name)}>
                    Add To Cart
                  </button>
                </div>
              </article>
            ))}

            {sortedProducts.length === 0 && (
              <p className="empty-state">No products found. Try a broader search or another category.</p>
            )}
          </div>
        </section>

        <p className={`cart-toast ${lastAdded ? "is-visible" : ""}`} role="status" aria-live="polite">
          Added {lastAdded || "item"} to cart
        </p>

        <button type="button" className="chat-button" aria-label="Open chat">
          1
        </button>
      </section>
    </main>
  );
}
