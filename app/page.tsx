"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  currency?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
  rating?: number;
  sold_count?: number;
  original_price?: string|number;
  is_deal?: boolean;
  deal_end_at?: string;
};

const categories = [
  { icon: "📱", name: "Phones", value: "Phones" },
  { icon: "💻", name: "Electronics", value: "Electronics" },
  { icon: "🎮", name: "Gaming", value: "Gaming" },
  { icon: "👕", name: "Fashion", value: "Fashion" },
  { icon: "💄", name: "Beauty", value: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries", value: "Groceries" },
  { icon: "🏡", name: "Home", value: "Home & Kitchen" },
  { icon: "💎", name: "Jewelry", value: "Jewelry & Accessories" },
];

const discoveryTabs = ["All", "⚡ Deals", "5-Star Rated", "Best Selling", "New Arrivals"];

const quickLinks = [
  { href: "/shop", icon: "🛍️", label: "Shop All", sub: "Browse every department", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#243B53]", border: "border-[#FFF8F2]" },
  { href: "/track-order", icon: "📦", label: "Track Order", sub: "Follow your purchases", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#243B53]", border: "border-[#FFF8F2]" },
  { href: "/order-protection", icon: "🛡️", label: "Buyer Protection", sub: "Get help with an order", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#FF6B00]", border: "border-[#FFF8F2]" },
  { href: "/help", icon: "🎧", label: "Help Centre", sub: "Answers and support", tone: "from-[#FFF8F2] to-[#FFF8F2] text-[#FF6B00]", border: "border-[#FFE9CC]" },
  { href: "/chat", icon: "💬", label: "Messages", sub: "Connect with sellers", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#FF6B00]", border: "border-[#FFF8F2]" },
];

function formatPrice(price: string | number, currency?: string | null) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "0.00";

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  switch (currency?.toUpperCase()) {
    case "USD":
      return `$${formatted}`;
    case "EUR":
      return `€${formatted}`;
    case "GBP":
      return `£${formatted}`;
    case "NGN":
      return `₦${formatted}`;
    default:
      return formatted;
  }
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const rating = Number(product.rating || 0);
  const available = Number(product.stock) > 0;
  const originalPrice = Number(product.original_price);
  const hasDiscount = Boolean(product.is_deal) && Number.isFinite(originalPrice) && originalPrice > Number(product.price);

  return (
    <article className={"gm-stuffuss-v2-tile" + (compact ? " gm-stuffuss-v2-tile--compact" : "")}>
      <Link href={"/product/" + product.id} className="gm-stuffuss-v2-tile-image" aria-label={"View " + product.name}>
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill
            sizes={compact ? "(max-width: 640px) 52vw, 230px" : "(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 240px"}
            className="gm-stuffuss-v2-tile-photo" />
        ) : (
          <span className="gm-stuffuss-v2-product-placeholder" aria-hidden="true">▣</span>
        )}
        {!available ? (
          <span className="gm-stuffuss-v2-product-badge">Sold out</span>
        ) : hasDiscount ? (
          <span className="gm-stuffuss-v2-product-badge">Special offer</span>
        ) : null}
      </Link>
      <div className="gm-stuffuss-v2-tile-body">
        <p className="gm-stuffuss-v2-tile-category">{product.category_name || "GoldMart collection"}</p>
        <Link href={"/product/" + product.id} className="gm-stuffuss-v2-tile-title">{product.name}</Link>
        <div className="gm-stuffuss-v2-price-row">
          <strong>{formatPrice(product.price, product.currency)}</strong>
          {hasDiscount && <s>{formatPrice(originalPrice, product.currency)}</s>}
        </div>
        <div className="gm-stuffuss-v2-tile-rating">
          <span aria-hidden="true">★</span>
          <span>{Number.isFinite(rating) ? rating.toFixed(1) : "0.0"} / 5</span>
          <span aria-hidden="true">·</span>
          <span>{available ? "In stock" : "Unavailable"}</span>
        </div>
        <div className="gm-stuffuss-v2-cart">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              stock: product.stock,
              currency: product.currency || "USD",
            }}
            disabled={!available}
          />
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const savedUser = localStorage.getItem("goldmart_user");
    if (!savedUser) return;
    try {
      const parsed: User = JSON.parse(savedUser);
      setUser(parsed && typeof parsed === "object" ? parsed : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(false);
        const response = await fetch(`${API_URL}/api/products`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load products");
        }
        if (!controller.signal.aborted) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("GoldMart products error:", error);
          setProductsError(true);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, []);

  function handleSearch() {
    const query = search.trim();
    window.location.href = query
      ? `/shop?search=${encodeURIComponent(query)}`
      : "/shop";
  }

  const displayedProducts = useMemo(() => {
    let result = [...products];

    if (activeTab === "⚡ Deals") {
      result = result.filter(product => product.is_deal === true);
    } else if (activeTab === "5-Star Rated") {
      result = result.filter((product) => Number(product.rating || 0) >= 5);
    } else if (activeTab === "Best Selling") {
      result.sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0));
    } else if (activeTab === "New Arrivals") {
      // Product IDs are used as a provisional recency signal.
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }
    return result;
  }, [products, activeTab]);

  return (
    <main className="gm-marketplace-home gm-stuffuss-v2" aria-label="GoldMart storefront">
      <div className="gm-stuffuss-v2-canvas">
        <header className="gm-stuffuss-v2-header">
          <Link href="/" className="gm-stuffuss-v2-logo" aria-label="GoldMart home">
            <span className="gm-stuffuss-v2-logo-mark" aria-hidden="true">◈</span>
            GoldMart
          </Link>
          <nav aria-label="Store navigation">
            <Link href="/" aria-current="page">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/help">Help</Link>
          </nav>
          <div className="gm-stuffuss-v2-header-actions">
            {user && <Link href="/notifications" aria-label="Notifications" title="Notifications">♧</Link>}
            <Link href={user ? "/account" : "/login"} aria-label="Account" title="My account">♙</Link>
            <Link href="/cart" aria-label="Shopping cart" title="Shopping cart">♧</Link>
          </div>
        </header>

        <section className="gm-stuffuss-v2-hero" aria-label="Discover GoldMart">
          <span className="gm-stuffuss-v2-hero-eyebrow">A WORLD OF EVERYDAY FINDS</span>
          <h1>Shop</h1>
        </section>

        <section className="gm-stuffuss-v2-searchbar" aria-label="Search GoldMart products">
          <div>
            <h2>Give All You Need</h2>
            <p>Curated finds, independent sellers, endless possibilities.</p>
          </div>
          <form role="search" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
            <label className="gm-stuffuss-v2-search-input">
              <span className="gm-stuffuss-v2-sr-only">Search products</span>
              <input type="search" aria-label="Search products on GoldMart" placeholder="Search on GoldMart..."
                value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <Link href="/visual-search" className="gm-stuffuss-v2-visual-search" aria-label="Search with an image" title="Visual search">⌗</Link>
            <button type="submit">Search</button>
          </form>
        </section>

        <div className="gm-stuffuss-v2-catalog">
          <aside className="gm-stuffuss-v2-sidebar" aria-label="Product categories">
            <h2>Category</h2>
            <nav aria-label="Browse departments">
              <Link href="/shop" className="gm-stuffuss-v2-sidebar-all"><span aria-hidden="true">▦</span>All products</Link>
              {categories.map((category) => (
                <Link key={category.value} href={"/shop?category=" + encodeURIComponent(category.value)}>
                  <span aria-hidden="true">{category.icon}</span>{category.name}
                </Link>
              ))}
            </nav>
            <div className="gm-stuffuss-v2-sidebar-extra">
              <h3>Discover</h3>
              <Link href="/shop?sort=new">New arrivals <span aria-hidden="true">↗</span></Link>
              <Link href="/categories">All departments <span aria-hidden="true">↗</span></Link>
              <Link href="/track-order">Track an order <span aria-hidden="true">↗</span></Link>
            </div>
          </aside>

          <section className="gm-stuffuss-v2-product-section" aria-label="Browse GoldMart products">
            <div className="gm-stuffuss-v2-section-title">
              <div>
                <p>OUR MARKETPLACE</p>
                <h2>Find something you'll love.</h2>
              </div>
              <Link href="/shop">View all products <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="gm-stuffuss-v2-tabs" role="tablist" aria-label="Filter products">
              {discoveryTabs.map((tab) => (
                <button key={tab} role="tab" type="button" aria-selected={activeTab === tab}
                  className={activeTab === tab ? "is-active" : ""}
                  onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            {loadingProducts ? (
              <div className="gm-stuffuss-v2-products" aria-label="Loading products">
                {[1,2,3].map((item) => <div key={item} className="gm-stuffuss-v2-skeleton" aria-hidden="true">
                  <div/><span/><span/>
                </div>)}
              </div>
            ) : displayedProducts.length > 0 ? (
              <div className="gm-stuffuss-v2-products">
                {displayedProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="gm-stuffuss-v2-empty" role="status">
                <span aria-hidden="true">▦</span>
                <h3>{productsError ? "Products are unavailable" : "Nothing in this selection yet"}</h3>
                <p>{productsError ? "We're unable to load the marketplace right now." : "Try another category or browse the full shop."}</p>
                <Link href="/shop">Explore the shop →</Link>
              </div>
            )}
            <div className="gm-stuffuss-v2-catalog-bottom">
              <Link href="/shop">Explore the full collection <span aria-hidden="true">→</span></Link>
              <span>{!loadingProducts && !productsError ? displayedProducts.length + " items in this selection" : "Discover more in the shop"}</span>
            </div>
          </section>
        </div>

        <section className="gm-stuffuss-v2-recommendations" aria-label="Discover more on GoldMart">
          <div className="gm-stuffuss-v2-section-title">
            <div>
              <p>HANDPICKED FOR YOU</p>
              <h2>Explore our recommendations</h2>
            </div>
            <Link href="/shop">Browse all <span aria-hidden="true">→</span></Link>
          </div>
          {products.length > 12 ? (
            <div className="gm-stuffuss-v2-reco-list">
              {products.slice(12, 16).map((product) => <ProductCard key={product.id} product={product} compact />)}
            </div>
          ) : (
            <div className="gm-stuffuss-v2-category-cards">
              {categories.slice(0, 4).map((category) => (
                <Link key={category.value} href={"/shop?category=" + encodeURIComponent(category.value)}>
                  <span aria-hidden="true">{category.icon}</span>
                  <strong>{category.name}</strong>
                  <span>Discover products ↗</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="gm-stuffuss-v2-feature" aria-label="Keep discovering">
          <div>
            <h2>Ready to Get<br/>Our New Stuff?</h2>
            <Link href="/shop">Explore GoldMart <span aria-hidden="true">→</span></Link>
          </div>
          <p>Find the products that fit your everyday life. Discover new arrivals, thoughtful picks, and independent sellers—all in one place.</p>
        </section>

        <footer className="gm-stuffuss-v2-footer">
          <div className="gm-stuffuss-v2-footer-links">
            <div><h3>GoldMart</h3><p>Everything you need. A simpler way to shop.</p></div>
            <nav aria-label="About GoldMart"><h4>Discover</h4>
              <Link href="/">Home</Link><Link href="/shop">Shop all</Link>
              <Link href="/categories">Categories</Link><Link href="/seller">Sell on GoldMart</Link>
            </nav>
            <nav aria-label="GoldMart support"><h4>Support</h4>
              <Link href="/help">Help centre</Link><Link href="/orders">Your orders</Link>
              <Link href="/track-order">Track order</Link><Link href="/order-protection">Buyer protection</Link>
            </nav>
            <nav aria-label="Your GoldMart account"><h4>Your account</h4>
              <Link href="/account">My account</Link><Link href="/cart">Your cart</Link>
              <Link href="/notifications">Notifications</Link><Link href="/chat">Messages</Link>
            </nav>
          </div>
          <div className="gm-stuffuss-v2-footer-bottom">
            <small>© {new Date().getFullYear()} GoldMart. All rights reserved.</small>
            <Link href="/help">Need help? Visit the Help Centre ↗</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
