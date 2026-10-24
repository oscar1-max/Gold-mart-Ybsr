import Link from "next/link";
import type { ReactNode } from "react";

type Department = {
  key: string;
  label: string;
  headline: string;
  description: string;
  eyebrow: string;
  theme: string;
  heroImage: string;
  promise: string;
  promo: string;
  tiles: { label: string; icon: string; query: string; image: string }[];
};

const photo = (id: string, width = 1300) =>
  "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + width + "&q=85";

const departments: Record<string, Department> = {
  Phones: {
    key: "Phones", label: "Phones", theme: "phones",
    eyebrow: "NEXT GENERATION MOBILE",
    headline: "Capture more of every moment.",
    description: "Explore phones that keep up with every part of your day.",
    promise: "Find the phone that feels like yours",
    promo: "A smarter way to explore mobile",
    heroImage: photo("photo-1511707171634-5f897ff02aa9"),
    tiles: [
      { label: "Flagship", icon: "✦", query: "pro", image: photo("photo-1511707171634-5f897ff02aa9",400) },
      { label: "Mid-Range", icon: "◈", query: "phone", image: photo("photo-1592750475338-74b7b21085ab",400) },
      { label: "Budget", icon: "◉", query: "mobile", image: photo("photo-1512499617640-c74ae3a79d37",400) },
      { label: "Gaming Phones", icon: "◇", query: "gaming", image: photo("photo-1603891128711-11b4b03bb138",400) },
      { label: "Camera Phones", icon: "◎", query: "camera", image: photo("photo-1511707171634-5f897ff02aa9",400) },
      { label: "5G Phones", icon: "5G", query: "5g", image: photo("photo-1592750475338-74b7b21085ab",400) }
    ]
  },
  Electronics: {
    key: "Electronics", label: "Electronics", theme: "electronics",
    eyebrow: "PREMIUM ELECTRONICS & GEAR",
    headline: "Better gear. Bigger possibilities.",
    description: "Explore useful technology and accessories for every moment.",
    promise: "Technology made for your lifestyle",
    promo: "Power up your everyday",
    heroImage: photo("photo-1498049794561-7780e7231661"),
    tiles: [
      { label: "Laptops", icon: "▣", query: "laptop", image: photo("photo-1496181133206-80ce9b88a853",400) },
      { label: "Headphones", icon: "♫", query: "headphone", image: photo("photo-1505740420928-5e560c06d30e",400) },
      { label: "Smart Devices", icon: "◎", query: "smart", image: photo("photo-1523275335684-37898b6baf30",400) },
      { label: "Chargers", icon: "ϟ", query: "charger", image: photo("photo-1583394838336-acd977736f90",400) },
      { label: "Cameras", icon: "◉", query: "camera", image: photo("photo-1516035069371-29a1b244cc32",400) },
      { label: "Accessories", icon: "▤", query: "accessory", image: photo("photo-1519389950473-47ba0277781c",400) }
    ]
  },
  Groceries: {
    key: "Groceries", label: "Groceries", theme: "groceries",
    eyebrow: "EVERYDAY LIVING, MADE EASIER",
    headline: "Fresh finds for every day.",
    description: "Discover groceries and home essentials in one beautiful place.",
    promise: "Everything your everyday needs",
    promo: "A little joy for your daily routine",
    heroImage: photo("photo-1542838132-92c53300491e"),
    tiles: [
      { label: "Fresh Produce", icon: "✿", query: "fruit", image: photo("photo-1542838132-92c53300491e",400) },
      { label: "Pantry", icon: "▤", query: "rice", image: photo("photo-1604908176997-125f25cc6f3d",400) },
      { label: "Beverages", icon: "◉", query: "drink", image: photo("photo-1544145945-f90425340c7e",400) },
      { label: "Breakfast", icon: "☀", query: "breakfast", image: photo("photo-1490645935967-10de6ba17061",400) },
      { label: "Snacks", icon: "♡", query: "snack", image: photo("photo-1599490659213-e2b9527bd087",400) },
      { label: "Daily Essentials", icon: "◈", query: "essential", image: photo("photo-1542838132-92c53300491e",400) }
    ]
  },
  Fashion: {
    key: "Fashion", label: "Fashion", theme: "fashion",
    eyebrow: "THE NEW STYLE EDIT",
    headline: "Elevate your everyday style.",
    description: "Timeless pieces and fresh finds, styled your way.",
    promise: "Find your perfect style",
    promo: "Make every outfit your own",
    heroImage: photo("photo-1539109136881-3be0616acf4b"),
    tiles: [
      { label: "Women's Fashion", icon: "✧", query: "women", image: photo("photo-1539109136881-3be0616acf4b",400) },
      { label: "Men's Fashion", icon: "◇", query: "men", image: photo("photo-1617127365659-c47fa864d8bc",400) },
      { label: "Dresses", icon: "♧", query: "dress", image: photo("photo-1595777457583-95e059d581b8",400) },
      { label: "Shoes", icon: "◈", query: "shoe", image: photo("photo-1542291026-7eec264c27ff",400) },
      { label: "Bags", icon: "▣", query: "bag", image: photo("photo-1548036328-c9fa89d128fa",400) },
      { label: "Accessories", icon: "✦", query: "accessory", image: photo("photo-1511499767150-a48a237f0083",400) }
    ]
  },
  Gaming: {
    key: "Gaming", label: "Gaming", theme: "gaming",
    eyebrow: "TRENDING NOW",
    headline: "Discover gaming gear you'll love.",
    description: "Level up your setup with consoles, accessories and everyday essentials.",
    promise: "Choose your next adventure",
    promo: "Upgrade your play space",
    heroImage: photo("photo-1542751371-adc38448a05e"),
    tiles: [
      { label: "Consoles", icon: "⌘", query: "console", image: photo("photo-1486406146926-c627a92ad1ab",400) },
      { label: "Controllers", icon: "🎮", query: "controller", image: photo("photo-1592840496694-26d035b52b48",400) },
      { label: "Headsets", icon: "♫", query: "headset", image: photo("photo-1505740420928-5e560c06d30e",400) },
      { label: "Keyboards", icon: "⌨", query: "keyboard", image: photo("photo-1587829741301-dc798b83add3",400) },
      { label: "PC Gaming", icon: "▣", query: "pc", image: photo("photo-1542751371-adc38448a05e",400) },
      { label: "Accessories", icon: "✦", query: "gaming", image: photo("photo-1511512578047-dfb367046420",400) }
    ]
  },
  "Beauty & Cosmetics": {
    key: "Beauty & Cosmetics", label: "Beauty & Cosmetics", theme: "beauty",
    eyebrow: "YOUR DAILY SELF-CARE RITUAL",
    headline: "Beauty that makes you shine.",
    description: "Explore skincare, cosmetics and little moments of self-care.",
    promise: "Feel good, every day",
    promo: "Find your next glow essential",
    heroImage: photo("photo-1596462502278-27bfdc403348"),
    tiles: [
      { label: "Serums", icon: "✧", query: "serum", image: photo("photo-1601049541289-9b1b7bbbfe19",400) },
      { label: "Moisturizers", icon: "◉", query: "cream", image: photo("photo-1556228720-195a672e8a03",400) },
      { label: "Cleansers", icon: "◇", query: "cleanser", image: photo("photo-1596462502278-27bfdc403348",400) },
      { label: "Makeup", icon: "✦", query: "makeup", image: photo("photo-1512496015851-a90fb38ba796",400) },
      { label: "Fragrances", icon: "♡", query: "perfume", image: photo("photo-1541643600914-78b084683601",400) },
      { label: "Sun Care", icon: "☼", query: "sunscreen", image: photo("photo-1596462502278-27bfdc403348",400) }
    ]
  },
  "Jewelry & Accessories": {
    key: "Jewelry & Accessories", label: "Jewelry & Accessories", theme: "jewelry",
    eyebrow: "TIMELESS ELEGANCE. MODERN YOU.",
    headline: "Jewelry that tells your story.",
    description: "Explore thoughtful pieces for every moment worth celebrating.",
    promise: "Little details, lasting impressions",
    promo: "Find something that feels personal",
    heroImage: photo("photo-1515562141207-7a88fb7ce338"),
    tiles: [
      { label: "Necklaces", icon: "◇", query: "necklace", image: photo("photo-1599643477877-530eb83abc8e",400) },
      { label: "Rings", icon: "◈", query: "ring", image: photo("photo-1605100804763-247f67b3557e",400) },
      { label: "Bracelets", icon: "✧", query: "bracelet", image: photo("photo-1611652022419-a9419f74343d",400) },
      { label: "Earrings", icon: "✦", query: "earring", image: photo("photo-1535632066927-ab7c9ab60908",400) },
      { label: "Watches", icon: "◷", query: "watch", image: photo("photo-1523275335684-37898b6baf30",400) },
      { label: "Accessories", icon: "♡", query: "accessory", image: photo("photo-1515562141207-7a88fb7ce338",400) }
    ]
  },
  "Home & Kitchen": {
    key: "Home & Kitchen", label: "Home & Kitchen", theme: "kitchen",
    eyebrow: "A BETTER EVERYDAY STARTS AT HOME",
    headline: "Upgrade your kitchen & home.",
    description: "Explore cookware, practical tools and beautiful everyday essentials.",
    promise: "Made for the moments at home",
    promo: "Style meets everyday function",
    heroImage: photo("photo-1556911220-e15b29be8c8f"),
    tiles: [
      { label: "Cookware", icon: "◒", query: "pan", image: photo("photo-1556911220-e15b29be8c8f",400) },
      { label: "Kitchen Tools", icon: "⌁", query: "knife", image: photo("photo-1556910103-1c02745aae4d",400) },
      { label: "Bakeware", icon: "▤", query: "baking", image: photo("photo-1556911220-e15b29be8c8f",400) },
      { label: "Dinnerware", icon: "◎", query: "bowl", image: photo("photo-1578749556568-bc2c40e68b61",400) },
      { label: "Storage", icon: "◫", query: "storage", image: photo("photo-1556911220-e15b29be8c8f",400) },
      { label: "Appliances", icon: "▣", query: "appliance", image: photo("photo-1556911220-e15b29be8c8f",400) }
    ]
  }
};

export const showroomDepartments = [
  { category: "Phones", label: "Phones", icon: "📱", theme: "phones" },
  { category: "Electronics", label: "Electronics", icon: "💻", theme: "electronics" },
  { category: "Groceries", label: "Groceries", icon: "🛒", theme: "groceries" },
  { category: "Fashion", label: "Fashion", icon: "👗", theme: "fashion" },
  { category: "Gaming", label: "Gaming", icon: "🎮", theme: "gaming" },
  { category: "Beauty & Cosmetics", label: "Beauty", icon: "✨", theme: "beauty" },
  { category: "Jewelry & Accessories", label: "Jewelry", icon: "💎", theme: "jewelry" },
  { category: "Home & Kitchen", label: "Home & Kitchen", icon: "🍳", theme: "kitchen" }
];

export default function CategoryShowcase({ category, children }: { category: string; children: ReactNode }) {
  const item = departments[category];
  if (!item) return null;
  const href = (query = "") => "/shop?category=" + encodeURIComponent(item.key) +
    (query ? "&search=" + encodeURIComponent(query) : "");

  return (
    <div className={"gm-dept gm-dept--" + item.theme} aria-label={item.label + " collection"}>
      <div className="gm-dept-container">
        <div className="gm-dept-mini-nav">
          <Link href="/" className="gm-dept-logo">Gold<span>Mart</span><small> / {item.label}</small></Link>
          <nav aria-label="Department navigation">
            <Link href="/">Home</Link>
            <Link href="/shop">All products</Link>
            <Link href="/cart">Cart ↗</Link>
          </nav>
        </div>

        <section className="gm-dept-hero" style={{ backgroundImage:
          "linear-gradient(90deg, var(--dept-overlay-start), var(--dept-overlay-end)), url('" + item.heroImage + "')" }}>
          <div className="gm-dept-hero-content">
            <p className="gm-dept-kicker">{item.eyebrow}</p>
            <h1>{item.headline}</h1>
            <p className="gm-dept-intro">{item.description}</p>
            <a href="#goldmart-department-products" className="gm-dept-hero-button">Explore the collection <span aria-hidden="true">→</span></a>
            <div className="gm-dept-hero-points" aria-label="Marketplace services">
              <span>✧ Curated discovery</span>
              <span>⌑ Order tracking</span>
              <span>◈ Support</span>
            </div>
          </div>
          <span className="gm-dept-hero-watermark" aria-hidden="true">{item.theme === "phones" ? "01" : "GoldMart"}</span>
        </section>

        <div className="gm-dept-benefit-row" aria-label="GoldMart shopping support">
          <a href="#goldmart-department-products"><span aria-hidden="true">✦</span><strong>Featured finds</strong><small>See available products</small></a>
          <Link href="/track-order"><span aria-hidden="true">▤</span><strong>Track your order</strong><small>Follow your purchase</small></Link>
          <Link href="/order-protection"><span aria-hidden="true">◇</span><strong>Buyer protection</strong><small>Get purchase support</small></Link>
          <Link href="/help"><span aria-hidden="true">♧</span><strong>Help Centre</strong><small>We're here to help</small></Link>
        </div>

        <section className="gm-dept-categories">
          <div className="gm-dept-section-heading">
            <div>
              <p className="gm-dept-section-kicker">{item.theme === "jewelry" ? "CURATED FOR YOU" : "THE COLLECTION"}</p>
              <h2>{item.theme === "fashion" ? "Find your perfect style" : item.theme === "kitchen" ? "Shop by kitchen category" : "Shop by category"}</h2>
            </div>
            <a href="#goldmart-department-products">See products ↓</a>
          </div>
          <div className="gm-dept-tiles">
            {item.tiles.map(tile => (
              <a key={tile.label} href={href(tile.query)} className="gm-dept-tile">
                <span className="gm-dept-tile-image" style={{ backgroundImage: "url('" + tile.image + "')" }}>
                  <span className="gm-dept-tile-icon" aria-hidden="true">{tile.icon}</span>
                </span>
                <span className="gm-dept-tile-label">{tile.label}</span>
                <span className="gm-dept-tile-action">Explore →</span>
              </a>
            ))}
          </div>
        </section>

        <section className="gm-dept-products" aria-label={item.label + " products"}>
          <div className="gm-dept-section-heading">
            <div>
              <p className="gm-dept-section-kicker">FROM GOLDMART SELLERS</p>
              <h2>{item.theme === "fashion" ? "Our most loved finds" : item.theme === "jewelry" ? "Discover the collection" : item.theme === "electronics" ? "Top picks for you" : item.theme === "phones" ? "Featured phones" : item.theme === "gaming" ? "New arrivals & favorites" : "Featured products"}</h2>
            </div>
            <Link href="/shop">All departments ↗</Link>
          </div>
          {children}
        </section>

        <div className="gm-dept-story">
          <div>
            <p className="gm-dept-section-kicker">THE GOLDMART EDIT</p>
            <h2>{item.promo}</h2>
            <p>{item.promise}. Discover products available from GoldMart sellers.</p>
            <Link href={href()}>Browse {item.label} <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="gm-dept-story-image" style={{ backgroundImage: "url('" + item.heroImage + "')" }} role="img" aria-label={item.label + " collection inspiration"} />
        </div>
      </div>
    </div>
  );
}
