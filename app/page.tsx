"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addCartItem, getCartCount } from "./lib/cart";
import { catalogProducts } from "./lib/catalog";

type Product = {
  slug: string;
  name: string;
  category: string;
  type: string;
  tag: string;
  price: string;
  description: string;
  meter: string;
  image?: string;
  secondaryImage?: string;
  rating: number;
  reviews: number;
  badge: string;
};

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
  picks?: Product[];
  followUps?: string[];
};

type SetupBundle = {
  id: string;
  title: string;
  description: string;
  itemSlugs: string[];
  savings: number;
  badge: string;
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
        links: ["Superlight 2", "Wooting 60HE+", "Cloud III", "Anker Hubs"],
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

const products: Product[] = catalogProducts.map((item, index) => {
  const meterScore = Number.parseInt(item.meter, 10);
  const rating = Math.min(5, Math.max(4.1, Number((4.1 + (meterScore - 70) / 20).toFixed(1))));
  const badge = meterScore >= 92 ? "Top Pick" : meterScore >= 88 ? "Best Value" : "Popular";

  return {
    slug: item.slug,
    name: item.name,
    category: item.category,
    type: item.type,
    tag: item.tag,
    price: item.price,
    description: item.description,
    meter: item.meter,
    image: item.image,
    secondaryImage: item.image,
    rating,
    reviews: 420 + index * 137,
    badge,
  };
});

const setupBundles: SetupBundle[] = [
  {
    id: "fps-kit",
    title: "FPS Starter Kit",
    description: "Low-latency essentials for fast aim and stable tracking.",
    itemSlugs: ["logitech-g305-lightspeed", "wooting-60he", "steelseries-qck-heavy-xxl"],
    savings: 18,
    badge: "Competitive",
  },
  {
    id: "creator-kit",
    title: "Creator Streaming Kit",
    description: "Dialed-in audio, camera, and lighting for clean streams.",
    itemSlugs: ["fifine-am8-dynamic-microphone", "logitech-c922-pro-stream-webcam", "elgato-key-light-air"],
    savings: 24,
    badge: "Creator",
  },
  {
    id: "travel-kit",
    title: "Travel Desk Kit",
    description: "Portable setup stack for work sessions and game nights on the move.",
    itemSlugs: ["keychron-k2-pro", "anker-5-in-1-usb-c-hub", "baseus-blade-20000mah-65w-power-bank"],
    savings: 15,
    badge: "Portable",
  },
];

const shopCategories = ["All", "Mice", "Keyboards", "Audio", "Power + Docks", "Mousepads", "Streaming"];
const assistantQuickPrompts = [
  "Gaming setup under $250",
  "Compact desk setup for work",
  "Streaming starter setup",
  "Travel-friendly accessories",
];

const parsePrice = (price: string) => Number(price.replace("$", ""));
const toProductSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const byTopMeter = (items: Product[]) => {
  return [...items].sort((a, b) => Number.parseInt(b.meter, 10) - Number.parseInt(a.meter, 10));
};

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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [availableQuickPrompts, setAvailableQuickPrompts] = useState(assistantQuickPrompts);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "bot",
      text:
        "I can help pick your setup. Tell me your goal, budget, and vibe (gaming, work, creator, streaming, travel), and I will suggest a stack.",
    },
  ]);

  const productBySlug = useMemo(() => {
    return new Map(products.map((item) => [item.slug, item]));
  }, []);

  const getAssistantReply = (prompt: string): Omit<ChatMessage, "id"> => {
    const lower = prompt.toLowerCase();
    const budgetMatch = lower.match(/\$?\s*(\d{2,4})/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : null;

    const wantsGaming = /game|gaming|rank|fps|esports|latency/.test(lower);
    const wantsWork = /work|office|productivity|coding|focus/.test(lower);
    const wantsCreator = /creator|content|video|record|podcast|editing/.test(lower);
    const wantsStreaming = /stream|camera|webcam|light|mic/.test(lower);
    const wantsTravel = /travel|portable|compact|small|lightweight/.test(lower);
    const wantsQuiet = /quiet|silent/.test(lower);

    const requestedCategory = shopCategories.find(
      (category) => category !== "All" && lower.includes(category.toLowerCase()),
    );

    const scored = products.map((item) => {
      let score = 0;
      const itemText = `${item.name} ${item.category} ${item.type} ${item.tag} ${item.description}`.toLowerCase();
      const price = parsePrice(item.price);

      if (requestedCategory && item.category === requestedCategory) {
        score += 6;
      }

      if (wantsGaming && /mouse|keyboard|headset|earbuds|esports|tournament|latency/.test(itemText)) {
        score += 3;
      }

      if (wantsWork && /ergonomic|dock|power bank|charger|keyboard|control/.test(itemText)) {
        score += 3;
      }

      if (wantsCreator && /microphone|dock|light|webcam|audio|creator/.test(itemText)) {
        score += 3;
      }

      if (wantsStreaming && /streaming|webcam|lighting|microphone|headset/.test(itemText)) {
        score += 4;
      }

      if (wantsTravel && /compact|portable|60%|earbuds|power bank|charger/.test(itemText)) {
        score += 3;
      }

      if (wantsQuiet && /silent|earbuds|closed-back/.test(itemText)) {
        score += 2;
      }

      if (budget !== null) {
        score += price <= budget ? 3 : -2;
      }

      return { item, score };
    });

    const relevant = scored.filter((entry) => entry.score > 0);
    const top = (relevant.length > 0 ? relevant : scored)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 3);

    const picks = top.length > 0 ? top : byTopMeter(products).slice(0, 3);
    const total = picks.reduce((sum, item) => sum + parsePrice(item.price), 0);
    const guidance =
      budget === null
        ? `Recommended 3-piece setup total: $${total}. Share a budget and I can tune this tighter.`
        : `Recommended 3-piece setup total: $${total}. ${
            total <= budget ? "This is inside your target budget." : "This is above your budget, so I prioritized performance first."
          }`;

    const followUps = [
      budget === null ? "Under $200" : `Keep under $${budget}`,
      wantsStreaming ? "Add creator audio" : "Streaming-ready setup",
      wantsGaming ? "Wireless only" : "Low-latency gaming setup",
    ];

    return {
      role: "bot",
      text: guidance,
      picks,
      followUps,
    };
  };

  const sendChatPrompt = (prompt: string) => {
    const normalized = prompt.trim();
    if (!normalized) {
      return;
    }

    setChatMessages((prev) => {
      const nextId = prev.length + 1;
      const reply = getAssistantReply(normalized);
      return [
        ...prev,
        { id: nextId, role: "user", text: normalized },
        { ...reply, id: nextId + 1 },
      ];
    });
    setChatInput("");
    setChatOpen(true);
  };

  const handleQuickPromptClick = (prompt: string) => {
    sendChatPrompt(prompt);
    setAvailableQuickPrompts((prev) => prev.filter((item) => item !== prompt));
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendChatPrompt(chatInput);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFeaturedProduct(0);
  };

  const handleAddToCart = (name: string, price: string) => {
    addCartItem({
      id: toProductSlug(name),
      name,
      price: parsePrice(price),
      quantity: 1,
    });
    setCartCount(getCartCount());
    setLastAdded(name);
  };

  const handleAddBundle = (bundle: SetupBundle) => {
    bundle.itemSlugs.forEach((slug) => {
      const item = productBySlug.get(slug);
      if (!item) {
        return;
      }

      addCartItem({
        id: item.slug,
        name: item.name,
        price: parsePrice(item.price),
        quantity: 1,
      });
    });

    setCartCount(getCartCount());
    setLastAdded(`${bundle.title} bundle`);
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

  useEffect(() => {
    const syncCartCount = () => {
      setCartCount(getCartCount());
    };

    syncCartCount();

    window.addEventListener("glitched-cart-updated", syncCartCount);

    return () => {
      window.removeEventListener("glitched-cart-updated", syncCartCount);
    };
  }, []);

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

      <header className="brand-row">
        <Image
          src="/glitched-logo4.png"
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
            <a href="#catalog" className="utility-link" aria-label="Jump to catalog">
              Search
            </a>
            <Link href="/cart" className="utility-link" aria-label="Open cart">
              Cart <span className="cart-count">{cartCount}</span>
            </Link>

            {activeMenu && (
              <div className="mega-menu" role="menu" aria-label={`${activeMenu.title} submenu`}>
                {activeMenu.columns.map((column) => (
                  <section key={column.heading} className="mega-column">
                    <h3>{column.heading}</h3>
                    <ul>
                      {column.links.map((link) => (
                        <li key={link}>
                          <button type="button" className="mega-link">
                            {link}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
        </nav>
      </header>

      <section className="hero" aria-label="Glitched accessories store">

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
            <button type="button" onClick={() => handleCategoryChange("Keyboards")}>
              Shop Keyboards
            </button>
            <button type="button" onClick={() => handleCategoryChange("Mice")}>
              Shop Mice
            </button>
            <button type="button" onClick={() => handleCategoryChange("Audio")}>
              Audio + ANC
            </button>
            <button type="button" onClick={() => handleCategoryChange("Power + Docks")}>
              Power + Docks
            </button>
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
              {item.image && (
                <div className="product-thumb" aria-hidden="true">
                  <Image src={item.image} alt="" width={520} height={320} className="thumb-primary" />
                  <Image src={item.secondaryImage || item.image} alt="" width={520} height={320} className="thumb-secondary" />
                </div>
              )}
              <div className="card-chip-row">
                <p className="tag">{item.tag}</p>
                <p className="proof-badge">{item.badge}</p>
              </div>
              <h2>
                <Link href={`/products/${item.slug}`}>{item.name}</Link>
              </h2>
              <p className="rating-row">★ {item.rating.toFixed(1)} · {item.reviews.toLocaleString()} reviews</p>
              <p>{item.description}</p>
              <div className="meter" aria-hidden="true">
                <span style={{ width: item.meter }} />
              </div>
              <div className="product-row">
                <strong>{item.price}</strong>
                <button type="button" onClick={() => handleAddToCart(item.name, item.price)}>
                  Add
                </button>
              </div>
            </article>
          ))}
        </section>

        <section id="catalog" className="catalog-section" aria-label="Tech accessory catalog">
          <section className="bundle-strip" aria-label="Recommended bundles">
            {setupBundles.map((bundle) => {
              const bundleItems = bundle.itemSlugs
                .map((slug) => productBySlug.get(slug))
                .filter((item): item is Product => Boolean(item));
              const bundleTotal = bundleItems.reduce((total, item) => total + parsePrice(item.price), 0) - bundle.savings;

              return (
                <article key={bundle.id} className="bundle-card">
                  <p className="bundle-badge">{bundle.badge}</p>
                  <h3>{bundle.title}</h3>
                  <p>{bundle.description}</p>
                  <ul>
                    {bundleItems.map((item) => (
                      <li key={item.slug}>{item.name}</li>
                    ))}
                  </ul>
                  <div className="bundle-row">
                    <strong>${bundleTotal}</strong>
                    <span>SAVE ${bundle.savings}</span>
                    <button type="button" onClick={() => handleAddBundle(bundle)}>
                      Add Bundle
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <header className="catalog-header">
            <h2>Browse By Gear Type</h2>
            <p>Click a category to view every matching item in the catalog.</p>

            <div className="catalog-sticky-bar">
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
            </div>
          </header>

          <div className="catalog-grid">
            {sortedProducts.map((item) => (
              <article key={item.name} className="catalog-card">
                {item.image && (
                  <div className="catalog-thumb" aria-hidden="true">
                    <Image src={item.image} alt="" width={560} height={360} className="thumb-primary" />
                    <Image src={item.secondaryImage || item.image} alt="" width={560} height={360} className="thumb-secondary" />
                  </div>
                )}
                <p className="catalog-meta">
                  <span>{item.category}</span>
                  <span>{item.type}</span>
                </p>
                <h3>{item.name}</h3>
                <p className="rating-row">★ {item.rating.toFixed(1)} · {item.reviews.toLocaleString()} reviews</p>
                <p className="catalog-description">{item.description}</p>
                <div className="catalog-row">
                  <strong>{item.price}</strong>
                  <button type="button" onClick={() => handleAddToCart(item.name, item.price)}>
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

        <aside className={`setup-chat ${chatOpen ? "is-open" : ""}`} aria-label="Setup assistant">
          {chatOpen && (
            <section className="chat-panel" aria-live="polite">
              <header className="chat-header">
                <h3>Setup Assistant</h3>
                <button type="button" onClick={() => setChatOpen(false)} aria-label="Close setup assistant">
                  x
                </button>
              </header>

              <div className="chat-messages">
                {chatMessages.map((message) => (
                  <article key={message.id} className={`chat-message ${message.role === "user" ? "is-user" : "is-bot"}`}>
                    <p>{message.text}</p>
                    {message.picks && (
                      <ul className="chat-picks">
                        {message.picks.map((item) => (
                          <li key={`${message.id}-${item.name}`}>
                            <div>
                              <strong>
                                <Link href={`/products/${toProductSlug(item.name)}`}>{item.name}</Link>
                              </strong>
                              <span>{item.price}</span>
                            </div>
                            <button type="button" onClick={() => handleAddToCart(item.name, item.price)}>
                              Add
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {message.followUps && message.followUps.length > 0 && (
                      <div className="chat-followups" aria-label="Chat follow-up suggestions">
                        {message.followUps.map((followUp) => (
                          <button key={`${message.id}-${followUp}`} type="button" onClick={() => sendChatPrompt(followUp)}>
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="chat-quick-actions" aria-label="Suggested prompts">
                {availableQuickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => handleQuickPromptClick(prompt)}>
                    {prompt}
                  </button>
                ))}
                {availableQuickPrompts.length < assistantQuickPrompts.length && (
                  <button type="button" onClick={() => setAvailableQuickPrompts(assistantQuickPrompts)}>
                    Reset presets
                  </button>
                )}
              </div>

              <form className="chat-form" onSubmit={handleChatSubmit}>
                <label htmlFor="setup-assistant-input" className="sr-only">
                  Describe your setup needs
                </label>
                <input
                  id="setup-assistant-input"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Need a setup under $300 for streaming"
                />
                <button type="submit">Send</button>
              </form>
            </section>
          )}

          <button
            type="button"
            className="chat-button"
            aria-label={chatOpen ? "Hide setup assistant" : "Open setup assistant"}
            aria-pressed={chatOpen}
            onClick={() => setChatOpen((prev) => !prev)}
          >
            1
          </button>
        </aside>
      </section>
    </main>
  );
}
