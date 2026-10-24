"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddToCartButton from "../../components/AddToCartButton";
import CategoryShowcase from "../../components/CategoryShowcase";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

const categories = [
  "All",
  "Electronics",
  "Gaming",
  "Fashion",
  "Phones",
  "Beauty & Cosmetics",
  "Groceries",
  "Home & Kitchen",
  "Jewelry & Accessories",
];

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  currency?: string | null;
  rating: number;
  is_deal?: boolean;
  original_price?: number;
  deal_end_at?: string;
  image: string;
  description: string;
  category: string;
};

export default function ShopPage() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // READ SEARCH AND CATEGORY FROM URL
  // =====================================================

  useEffect(() => {
    function readUrl() {
      const params =
        new URLSearchParams(
          window.location.search
        );

      const urlSearch =
        params.get("search") || "";

      const urlCategory =
        params.get("category") || "All";

      setSearch(urlSearch);

      if (
        categories.includes(
          urlCategory
        )
      ) {
        setSelectedCategory(
          urlCategory
        );
      } else {
        setSelectedCategory("All");
      }
    }

    readUrl();

    window.addEventListener(
      "popstate",
      readUrl
    );

    return () => {
      window.removeEventListener(
        "popstate",
        readUrl
      );
    };
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/products`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch products"
          );
        }

        const data =
          await response.json();

        if (!data.success) {
          throw new Error(
            data.message ||
              "Failed to fetch products"
          );
        }

        const formattedProducts: Product[] =
          Array.isArray(
            data.products
          )
            ? data.products.map(
                (product: any) => ({
                  id: product.id,
                  stock: Number(product.stock||0),
                  is_deal: Boolean(product.is_deal),
                  original_price: Number(product.original_price || product.price),
                  deal_end_at: product.deal_end_at,

                  name:
                    product.name,

                  price: Number(
                    product.price
                  ),

                  currency:
                    String(
                      product.currency ||
                        "USD"
                    ).toUpperCase(),

                  rating:
                    Number(
                      product.rating
                    ) || 4.5,

                  image:
                    product.image_url ||
                    "/images/headphones.jpg",

                  description:
                    product.description ||
                    "Quality product from GoldMart.",

                  category:
                    product.category_name ||
                    "Other",
                })
              )
            : [];

        setProducts(
          formattedProducts
        );
      } catch (err) {
        console.error(
          "Products error:",
          err
        );

        setError(
          "Unable to load products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  function handleSearch() {
    const query =
      search.trim();

    if (!query) {
      router.push("/shop");
      return;
    }

    router.push(
      `/shop?search=${encodeURIComponent(
        query
      )}`
    );
  }

  // =====================================================
  // CATEGORY
  // =====================================================

  function handleCategory(
    category: string
  ) {
    setSelectedCategory(
      category
    );

    const params =
      new URLSearchParams();

    if (search.trim()) {
      params.set(
        "search",
        search.trim()
      );
    }

    if (category !== "All") {
      params.set(
        "category",
        category
      );
    }

    const query =
      params.toString();

    if (query) {
      router.push(
        `/shop?${query}`
      );
    } else {
      router.push("/shop");
    }
  }

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  function formatPrice(
    price: number,
    currency?: string | null
  ) {
    const amount =
      Number(price);

    if (!Number.isFinite(amount)) {
      return "0.00";
    }

    const code =
      String(
        currency || "USD"
      ).toUpperCase();

    try {
      return new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ).format(amount);
    } catch {
      return `${code} ${amount.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    }
  }

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts =
    products.filter(
      (product) => {
        const selected =
          selectedCategory
            .toLowerCase()
            .trim();

        const productCategory =
          product.category
            .toLowerCase()
            .trim();

        const matchesCategory =
          selectedCategory ===
            "All" ||
          productCategory ===
            selected;

        const searchText =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !searchText ||
          product.name
            .toLowerCase()
            .includes(
              searchText
            ) ||
          product.description
            .toLowerCase()
            .includes(
              searchText
            ) ||
          product.category
            .toLowerCase()
            .includes(
              searchText
            );

        return (
          matchesCategory &&
          matchesSearch
        );
      }
    );

  const productResults = (
    <div className="gm-shop-results">
      <div className="gm-shop-result-tools">
        <div>
          <span className="gm-shop-result-eyebrow">REAL PRODUCTS · GOLDMART SELLERS</span>
          <p className="gm-shop-result-count" id="goldmart-department-products">
            {loading ? "Finding products…" : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {selectedCategory !== "All" && (
          <label className="gm-shop-dept-search">
            <span className="sr-only">Search within {selectedCategory}</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${selectedCategory} products`}
            />
          </label>
        )}
      </div>
      {selectedCategory !== "All" && search.trim() && (
        <div className="gm-shop-active-search">
          Results matching <strong>{search}</strong>
          <button type="button" onClick={() => { setSearch(""); router.replace(`/shop?category=${encodeURIComponent(selectedCategory)}`); }}>Clear search</button>
        </div>
      )}
      {loading ? (
        <div className="gm-products-grid" aria-label="Loading products">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="gm-shop-skeleton">
              <div className="gm-shop-skeleton-image" />
              <div className="gm-shop-skeleton-line" />
              <div className="gm-shop-skeleton-line short" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="gm-shop-empty" role="status">
          <span aria-hidden="true">⚠️</span>
          <h3>Products could not be loaded</h3>
          <p>{error}</p>
          <Link href="/help">Visit Help Centre →</Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="gm-shop-empty">
          <span aria-hidden="true">⌕</span>
          <h3>No matching products yet</h3>
          <p>Try another search or browse the full GoldMart collection.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              router.push("/shop");
            }}
          >View all products →</button>
        </div>
      ) : (
        <div className="gm-products-grid">
          {filteredProducts.map((product) => (
            <article className="gm-product-tile" key={product.id}>
              <Link href={`/product/${product.id}`} className="gm-product-image-link" aria-label={`View ${product.name}`}>
                <div className="gm-product-photo">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : <span aria-hidden="true">🛍️</span>}
                  {product.is_deal && <span className="gm-product-deal">Deal</span>}
                  {product.stock <= 0 && <span className="gm-product-unavailable">Sold out</span>}
                </div>
              </Link>
              <div className="gm-product-details">
                <p className="gm-product-category">{product.category}</p>
                <Link href={`/product/${product.id}`}><h3>{product.name}</h3></Link>
                <p className="gm-product-description">{product.description}</p>
                <p className="gm-product-rating">★ <span>{Number(product.rating || 0).toFixed(1)}</span></p>
                <div className="gm-product-prices">
                  <strong>{formatPrice(product.price, product.currency)}</strong>
                  {product.is_deal && Number(product.original_price || 0) > Number(product.price) &&
                    <s>{formatPrice(product.original_price || product.price, product.currency)}</s>}
                </div>
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image,
                    stock: product.stock,
                    currency: product.currency || "USD",
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="gm-shop-page min-h-screen bg-white pb-28 text-[#14263D] md:pb-14">
      {selectedCategory === "All" ? (
        <>
          <header className="gm-shop-simple-header">
            <div className="gm-shop-simple-header-inner">
              <Link href="/" className="gm-shop-wordmark">Gold<span>Mart</span></Link>
              <nav aria-label="Shop navigation">
                <Link href="/">Home</Link>
                <Link href="/categories">Departments</Link>
                <Link href="/cart">Cart ↗</Link>
              </nav>
            </div>
          </header>
          <section className="gm-shop-all-hero" aria-label="Shop all GoldMart products">
            <div>
              <p className="gm-shop-hero-eyebrow">THE GOLDMART COLLECTION</p>
              <h1>Find something you'll love.</h1>
              <p>Discover the products our sellers have in store.</p>
            </div>
          </section>
          <div className="gm-shop-all-content">
            <form
              role="search"
              className="gm-shop-all-search"
              onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search GoldMart products…"
                aria-label="Search all products"
              />
              <button type="submit">Search</button>
            </form>
            <div className="gm-shop-department-rail" aria-label="Shop by department">
              {categories.filter((category) => category !== "All").map((category) => (
                <button type="button" key={category}
                  onClick={() => handleCategory(category)}>{category}</button>
              ))}
            </div>
            {productResults}
          </div>
        </>
      ) : (
        <CategoryShowcase category={selectedCategory}>
          {productResults}
        </CategoryShowcase>
      )}
    </main>
  );
}
