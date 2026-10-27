"use client";

import Link from "next/link";
import "./checkout.css";
import { useMemo, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type PaymentMethod =
  | "card"
  | "transfer"
  | "wallet";

type Delivery = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressLine2: string;
};

function normalizeCurrency(currency?: string) {
  return String(currency || "USD").toUpperCase();
}

function getNumericPrice(
  price: string | number
) {
  if (typeof price === "number") {
    return price;
  }

  const cleaned = String(price)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const value = Number(cleaned);

  return Number.isFinite(value) ? value : 0;
}

function getCurrencySymbol(currency: string) {
  switch (normalizeCurrency(currency)) {
    case "NGN":
      return "₦";

    case "USD":
      return "$";

    case "GBP":
      return "£";

    case "EUR":
      return "€";

    case "GHS":
      return "GH₵";

    case "ZAR":
      return "R";

    case "KES":
      return "KSh";

    case "XOF":
      return "CFA";

    default:
      return currency;
  }
}

export default function CheckoutPage() {
  const { cart, refreshCartFromServer } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("card");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [delivery, setDelivery] =
    useState<Delivery>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
      postalCode: "",
      addressLine2: "",
    });

  // =====================================================
  // CART CURRENCIES
  // =====================================================

  const currencies = useMemo(() => {
    return Array.from(
      new Set(
        cart.map((item) =>
          normalizeCurrency(item.currency)
        )
      )
    );
  }, [cart]);

  const currency =
    currencies.length === 1
      ? currencies[0]
      : null;

  // =====================================================
  // SUBTOTAL
  // =====================================================

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        const price =
          getNumericPrice(item.price);

        return (
          total +
          price * Number(item.quantity)
        );
      },
      0
    );
  }, [cart]);

  // =====================================================
  // DELIVERY FEE
  // =====================================================

  // No carrier rate has been quoted. This is a test-only product total.
  const deliveryFee = 0;

  const total =
    subtotal + deliveryFee;

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  function formatPrice(
    amount: number
  ) {
    const currentCurrency =
      currency || "NGN";

    const symbol =
      getCurrencySymbol(
        currentCurrency
      );

    return `${symbol}${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  // =====================================================
  // UPDATE DELIVERY
  // =====================================================

  function updateDelivery(
    field: keyof Delivery,
    value: string
  ) {
    setDelivery((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // =====================================================
  // PLACE ORDER / PAYMENT
  // =====================================================

  async function handlePlaceOrder() {
    setError("");

    if (cart.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    if (!currency) {
      setError(
        "Your cart contains products with different currencies. Please remove the products with different currencies and try again."
      );
      return;
    }

    if (
      !delivery.firstName ||
      !delivery.lastName ||
      !delivery.email ||
      !delivery.phone ||
      !delivery.address ||
      !delivery.city ||
      !delivery.country
    ) {
      setError(
        "Please complete all delivery information."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) {
        setError(
          "Please log in before making a payment."
        );

        setLoading(false);
        return;
      }

      // =================================================
      // STEP 1: SYNC CART WITH DATABASE
      // =================================================

      const syncResponse =
        await fetch(
          `${API_URL}/api/cart/sync`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              items: cart.map(
                (item) => ({
                  productId:
                    item.id,

                  quantity:
                    Number(
                      item.quantity
                    ),
                })
              ),
            }),
          }
        );

      const syncData =
        await syncResponse.json();

      if (
        !syncResponse.ok ||
        !syncData.success
      ) {
        throw new Error(
          syncData.message ||
            "Unable to synchronize your cart."
        );
      }

      // =================================================
      // CHECK CART PRICES AGAINST NEON BEFORE PAYSTACK
      // =================================================

      // This GET happens after the cart sync above.
      // It updates the CartProvider with the actual
      // product prices/currencies stored in Neon.
      const refreshed = await refreshCartFromServer();

      if (refreshed.changed) {
        // The updated cart will now display on screen.
        // Ask the customer to review it before payment.
        throw new Error(
          "Your cart was updated with the latest prices or quantities. Please review the new order total and click Pay again. No payment was started."
        );
      }

      if (refreshed.cart.length === 0) {
        throw new Error(
          "Your cart is empty. Please add a product before paying."
        );
      }

      const verifiedCurrencies = Array.from(
        new Set(
          refreshed.cart.map((item) =>
            normalizeCurrency(item.currency)
          )
        )
      );

      if (
        verifiedCurrencies.length !== 1 ||
        !["USD", "NGN"].includes(verifiedCurrencies[0])
      ) {
        throw new Error(
          "Your cart needs products in one supported currency (USD or NGN)."
        );
      }

      const verifiedCurrency = verifiedCurrencies[0];

      // Calculate in cents to avoid floating-point
      // differences between checkout and the backend.
      let verifiedTotalMinor = 0;

      for (const item of refreshed.cart) {
        const itemPriceMinor = Math.round(
          getNumericPrice(item.price) * 100
        );
        const itemQuantity = Number(item.quantity);

        if (
          !Number.isSafeInteger(itemPriceMinor) ||
          itemPriceMinor <= 0 ||
          !Number.isInteger(itemQuantity) ||
          itemQuantity <= 0
        ) {
          throw new Error(
            "Your cart contains an invalid price or quantity. Please update it before paying."
          );
        }

        verifiedTotalMinor += itemPriceMinor * itemQuantity;
      }

      if (
        !Number.isSafeInteger(verifiedTotalMinor) ||
        verifiedTotalMinor <= 0
      ) {
        throw new Error(
          "Your cart total is invalid. No payment was started."
        );
      }

      const verifiedTotal = verifiedTotalMinor / 100;

      // Ensure the checkout screen is showing the same
      // total as the refreshed database cart.
      if (
        verifiedCurrency !== currency ||
        verifiedTotalMinor !== Math.round(total * 100)
      ) {
        throw new Error(
          "Your checkout total has been updated. Please review the amount shown and click Pay again. No payment was started."
        );
      }

      // =================================================
      // STEP 2: SAVE DELIVERY
      // =================================================

      sessionStorage.setItem(
        "goldmart-delivery",
        JSON.stringify(
          delivery
        )
      );

      // =================================================
      // STEP 3: INITIALIZE PAYMENT
      //
      // IMPORTANT:
      //
      // If product is NGN 10,000:
      // payment amount = NGN 10,000
      //
      // It must NOT become:
      // USD 10,000 × 1500
      // =================================================

      const paymentResponse =
        await fetch(
          `${API_URL}/api/payments/initialize`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email:
                delivery.email,

              amount:
                verifiedTotal,

              currency:
                verifiedCurrency,

              metadata: {
                payment_method:
                  paymentMethod,

                delivery,

                goldmart_currency:
                  verifiedCurrency,

                goldmart_total:
                  verifiedTotal,
              },
            }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (
        !paymentResponse.ok ||
        !paymentData.success
      ) {
        throw new Error(
          paymentData.message ||
            "Unable to initialize payment."
        );
      }

      const authorizationUrl =
        paymentData.payment
          ?.authorization_url;

      const reference =
        paymentData.payment
          ?.reference;

      if (
        !authorizationUrl ||
        !reference
      ) {
        throw new Error(
          "Payment provider did not return a payment URL."
        );
      }

      // =================================================
      // STEP 4: SAVE PAYMENT REFERENCE
      // =================================================

      sessionStorage.setItem(
        "goldmart-payment-reference",
        reference
      );

      // =================================================
      // STEP 5: REDIRECT TO PAYSTACK
      // =================================================

      window.location.href =
        authorizationUrl;
    } catch (err) {
      console.error(
        "Checkout error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while starting payment."
      );

      setLoading(false);
    }
  }


  // =====================================================
  // RESPONSIVE CHECKOUT VIEW (payment verification logic above unchanged)
  // =====================================================

  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
  const amountLabel = currency ? formatPrice(total) : "Check currencies";
  const paymentOptions: { key: PaymentMethod; title: string; detail: string; icon: string }[] = [
    { key: "card", title: "Card", detail: "Debit or credit", icon: "💳" },
    { key: "transfer", title: "Bank Transfer", detail: "Where available", icon: "🏦" },
    { key: "wallet", title: "Wallet", detail: "Where available", icon: "📱" },
  ];

  return (
    <main className="gm-checkout">
      <header className="gm-checkout-header">
        <div className="gm-checkout-header-inner">
          <Link href="/" className="gm-checkout-brand" aria-label="GoldMart home">
            Gold<span>Mart</span>
          </Link>
          <nav className="gm-checkout-links" aria-label="Checkout navigation">
            <Link href="/cart">← Cart</Link>
            <Link href="/">Home</Link>
          </nav>
        </div>
      </header>

      <div className="gm-checkout-container">
        <p className="gm-checkout-kicker">Secure checkout</p>
        <h1 className="gm-checkout-title">Complete your order</h1>
        <p className="gm-checkout-intro">Enter your delivery details, review your order and continue to secure payment.</p>

        {error && (
          <div className="gm-checkout-alert gm-checkout-alert-error" role="alert" aria-live="assertive">
            <strong>Unable to continue: </strong>{error}
          </div>
        )}
        {cart.length > 0 && currencies.length > 1 && (
          <div className="gm-checkout-alert gm-checkout-alert-warning" role="alert">
            Your cart contains different currencies. Please return to your cart and keep products in one currency before paying.
          </div>
        )}

        <div className="gm-checkout-layout">
          <div className="gm-checkout-left">
            <section className="gm-checkout-panel" aria-labelledby="checkout-delivery-heading">
              <div className="gm-checkout-panel-heading">
                <span className="gm-checkout-step" aria-hidden="true">1</span>
                <h2 id="checkout-delivery-heading">Delivery information</h2>
              </div>

              <div className="gm-checkout-form">
                {([
                  { key: "firstName", label: "First name", placeholder: "Your first name", autoComplete: "given-name", required: true },
                  { key: "lastName", label: "Last name", placeholder: "Your last name", autoComplete: "family-name", required: true },
                  { key: "email", label: "Email address", placeholder: "you@example.com", autoComplete: "email", required: true, type: "email" },
                  { key: "phone", label: "Phone number", placeholder: "Your contact number", autoComplete: "tel", required: true, type: "tel" },
                ] as const).map((field) => (
                  <div className="gm-checkout-field" key={field.key}>
                    <label htmlFor={"checkout-" + field.key}>
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <input
                      id={"checkout-" + field.key}
                      type={"type" in field ? field.type : "text"}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={delivery[field.key]}
                      onChange={(e) => updateDelivery(field.key, e.target.value)}
                    />
                  </div>
                ))}

                <div className="gm-checkout-field gm-checkout-field-full">
                  <label htmlFor="checkout-address">Full delivery address *</label>
                  <textarea
                    id="checkout-address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="Street name, house number and nearby landmark"
                    required
                    value={delivery.address}
                    onChange={(e) => updateDelivery("address", e.target.value)}
                  />
                </div>

                <div className="gm-checkout-field gm-checkout-field-full">
                  <label htmlFor="checkout-address2">Apartment, suite or building (optional)</label>
                  <input
                    id="checkout-address2"
                    autoComplete="address-line2"
                    placeholder="Apartment or floor number"
                    value={delivery.addressLine2}
                    onChange={(e) => updateDelivery("addressLine2", e.target.value)}
                  />
                </div>

                <div className="gm-checkout-field gm-checkout-field-full">
                  <label htmlFor="checkout-country">Country *</label>
                  <input
                    id="checkout-country"
                    autoComplete="country-name"
                    required
                    maxLength={100}
                    value={delivery.country}
                    onChange={(e) => updateDelivery("country", e.target.value)}
                  />
                </div>

                <div className="gm-checkout-field">
                  <label htmlFor="checkout-city">City *</label>
                  <input
                    id="checkout-city"
                    autoComplete="address-level2"
                    required
                    placeholder="City"
                    value={delivery.city}
                    onChange={(e) => updateDelivery("city", e.target.value)}
                  />
                </div>
                <div className="gm-checkout-field">
                  <label htmlFor="checkout-state">State / province (optional)</label>
                  <input
                    id="checkout-state"
                    autoComplete="address-level1"
                    maxLength={150}
                    placeholder="State or region"
                    value={delivery.state}
                    onChange={(e) => updateDelivery("state", e.target.value)}
                  />
                </div>
                <div className="gm-checkout-field gm-checkout-field-full">
                  <label htmlFor="checkout-postal">Postal / ZIP code (optional)</label>
                  <input
                    id="checkout-postal"
                    autoComplete="postal-code"
                    maxLength={32}
                    placeholder="Postal code"
                    value={delivery.postalCode}
                    onChange={(e) => updateDelivery("postalCode", e.target.value)}
                  />
                </div>
              </div>
              <p className="gm-checkout-help" style={{ marginTop: 14 }}>* Required information</p>
            </section>

            <section className="gm-checkout-panel" aria-labelledby="checkout-shipping-heading">
              <div className="gm-checkout-panel-heading">
                <span className="gm-checkout-step" aria-hidden="true">2</span>
                <h2 id="checkout-shipping-heading">Delivery method</h2>
              </div>
              <div className="gm-checkout-option">
                <input type="radio" name="delivery" checked readOnly aria-label="Worldwide delivery in test mode" />
                <div className="gm-checkout-option-content">
                  <strong>Worldwide delivery (test mode)</strong>
                  <span>Delivery availability, times and shipping charges have not been confirmed yet.</span>
                </div>
                <span className="gm-checkout-quote">Quote pending</span>
              </div>
            </section>

            <section className="gm-checkout-panel" aria-labelledby="checkout-payment-heading">
              <div className="gm-checkout-panel-heading">
                <span className="gm-checkout-step" aria-hidden="true">3</span>
                <h2 id="checkout-payment-heading">Payment method</h2>
              </div>
              <p className="gm-checkout-help">
                Select your preferred method. Paystack will show the payment options actually available for your currency and account.
              </p>
              <div className="gm-checkout-payment-grid" role="group" aria-label="Preferred payment method">
                {paymentOptions.map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    className="gm-checkout-payment-option"
                    aria-pressed={paymentMethod === method.key}
                    onClick={() => setPaymentMethod(method.key)}
                  >
                    <span className="gm-checkout-payment-icon" aria-hidden="true">{method.icon}</span>
                    <strong>{method.title}</strong>
                    <small>{method.detail}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="gm-checkout-disclaimer" aria-label="Delivery and payment testing notice">
              <strong>Important: delivery and payment testing</strong>
              <p>
                This checkout currently excludes shipping fees because no courier quote is available.
                That does not mean shipping is free. Delivery coverage, shipping costs and real-money
                refunds must be confirmed before live checkout is enabled.
              </p>
            </section>
          </div>

          <aside className="gm-checkout-panel gm-checkout-summary" aria-labelledby="checkout-summary-heading">
            <h2 id="checkout-summary-heading">Order summary</h2>
            {cart.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <p style={{ fontSize: 30 }} aria-hidden="true">🛒</p>
                <p style={{ fontWeight: 750, margin: "12px 0" }}>Your cart is empty</p>
                <Link href="/shop" style={{ color: "#71582f", fontWeight: 800 }}>Continue shopping</Link>
              </div>
            ) : (
              <>
                <ul className="gm-checkout-summary-list">
                  {cart.map((item) => {
                    const itemCurrency = normalizeCurrency(item.currency);
                    const price = getNumericPrice(item.price);
                    return (
                      <li className="gm-checkout-product" key={item.id}>
                        <div style={{ minWidth: 0 }}>
                          <div className="gm-checkout-product-name">{item.name}</div>
                          <div className="gm-checkout-product-meta">Qty: {item.quantity} · {itemCurrency}</div>
                        </div>
                        <span className="gm-checkout-product-price">
                          {getCurrencySymbol(itemCurrency)}
                          {(price * Number(item.quantity)).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="gm-checkout-totals">
                  <div className="gm-checkout-total-row">
                    <span>Items</span><strong>{itemCount}</strong>
                  </div>
                  <div className="gm-checkout-total-row">
                    <span>Subtotal</span><strong>{currency ? formatPrice(subtotal) : "Mixed currencies"}</strong>
                  </div>
                  <div className="gm-checkout-total-row">
                    <span>Delivery</span><strong>Not quoted (test)</strong>
                  </div>
                  <div className="gm-checkout-total-row gm-checkout-grand-total">
                    <span>Test total (excluding shipping)</span><strong>{amountLabel}</strong>
                  </div>
                </div>
                <div className="gm-checkout-desktop-pay" style={{ marginTop: 22 }}>
                  <button
                    type="button"
                    className="gm-checkout-pay"
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0 || !currency}
                  >
                    {loading ? "Starting secure payment…" : "Continue to pay " + amountLabel}
                  </button>
                </div>
                <p className="gm-checkout-secure">🔒 Secure payment through Paystack</p>
              </>
            )}
          </aside>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="gm-checkout-mobile-bar">
          <div className="gm-checkout-mobile-amount">
            <small>Test total · shipping excluded</small>
            <strong>{amountLabel}</strong>
          </div>
          <button
            type="button"
            className="gm-checkout-pay"
            onClick={handlePlaceOrder}
            disabled={loading || !currency}
          >
            {loading ? "Please wait…" : "Continue"}
          </button>
        </div>
      )}
    </main>
  );
}
