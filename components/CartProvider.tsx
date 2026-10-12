
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  currency?: string;
};

type RefreshResult = {
  changed: boolean;
  cart: CartItem[];
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (
    item: Omit<CartItem, "quantity">,
    quantity?: number
  ) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (
    id: number,
    quantity: number
  ) => void;
  clearCart: () => void;
  refreshCartFromServer:
    () => Promise<RefreshResult>;
  cartCount: number;
};

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

const STORAGE_KEY = "goldmart-cart";

// =====================================================
// PRICE AND CURRENCY HELPERS
// =====================================================

function normalizeCurrency(value?: string) {
  return String(value || "USD")
    .trim()
    .toUpperCase();
}

function priceInCents(value: string | number) {
  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return NaN;
  }

  return Math.round(number * 100);
}

function formatStoredPrice(
  value: string | number
) {
  const cents = priceInCents(value);

  if (!Number.isFinite(cents)) {
    return "0.00";
  }

  return (cents / 100).toFixed(2);
}

// =====================================================
// CART PROVIDER
// =====================================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] =
    useState(false);

  const cartRef = useRef<CartItem[]>([]);

  // ===================================================
  // LOAD LOCAL CART
  // ===================================================

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(STORAGE_KEY);

      if (savedCart) {
        const parsed = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          const restored = parsed
            .filter(
              (item) =>
                Number.isInteger(
                  Number(item?.id)
                ) &&
                Number(item?.id) > 0
            )
            .map((item) => ({
              id: Number(item.id),
              name: String(
                item.name || "Product"
              ),
              price: String(item.price ?? "0"),
              image: String(item.image || ""),
              quantity: Math.max(
                1,
                Math.floor(
                  Number(item.quantity) || 1
                )
              ),
              currency: normalizeCurrency(
                item.currency
              ),
            }));

          cartRef.current = restored;
          setCart(restored);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load GoldMart cart:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // ===================================================
  // KEEP CART REF CURRENT
  // ===================================================

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // ===================================================
  // SAVE LOCAL CART AFTER HYDRATION
  // ===================================================

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event("goldmart-cart-updated")
    );
  }, [cart, hydrated]);

  // ===================================================
  // ADD PRODUCT
  // ===================================================

  function addToCart(
    item: Omit<CartItem, "quantity">,
    quantity = 1
  ) {
    const safeQuantity = Math.max(
      1,
      Math.floor(Number(quantity) || 1)
    );

    setCart((current) => {
      const existing = current.find(
        (product) =>
          product.id === item.id
      );

      if (existing) {
        return current.map((product) =>
          product.id === item.id
            ? {
                ...product,
                name: item.name,
                price: String(item.price),
                image: item.image,
                currency:
                  normalizeCurrency(
                    item.currency
                  ),
                quantity:
                  product.quantity +
                  safeQuantity,
              }
            : product
        );
      }

      return [
        ...current,
        {
          ...item,
          price: String(item.price),
          currency: normalizeCurrency(
            item.currency
          ),
          quantity: safeQuantity,
        },
      ];
    });

    const token =
      localStorage.getItem(
        "goldmart_token"
      );

    if (token) {
      fetch(`${API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.id,
          quantity: safeQuantity,
        }),
      }).catch((error) => {
        console.error(
          "Backend add-to-cart error:",
          error
        );
      });
    }
  }

  // ===================================================
  // REMOVE PRODUCT
  // ===================================================

  function removeFromCart(id: number) {
    setCart((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    const token =
      localStorage.getItem(
        "goldmart_token"
      );

    if (token) {
      fetch(
        `${API_URL}/api/cart/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      ).catch((error) => {
        console.error(
          "Backend remove error:",
          error
        );
      });
    }
  }

  // ===================================================
  // UPDATE QUANTITY
  // ===================================================

  function updateQuantity(
    id: number,
    quantity: number
  ) {
    const safeQuantity =
      Math.floor(Number(quantity));

    if (
      !Number.isFinite(safeQuantity) ||
      safeQuantity <= 0
    ) {
      removeFromCart(id);
      return;
    }

    setCart((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              quantity: safeQuantity,
            }
          : product
      )
    );

    // Checkout synchronizes quantities
    // with the backend before payment.
  }

  // ===================================================
  // REFRESH PRICES FROM NEON THROUGH BACKEND
  // ===================================================

  async function refreshCartFromServer():
    Promise<RefreshResult> {
    const token =
      localStorage.getItem(
        "goldmart_token"
      );

    if (!token) {
      throw new Error(
        "Please log in to refresh your cart."
      );
    }

    const response = await fetch(
      `${API_URL}/api/cart`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data.success ||
      !Array.isArray(data.cart)
    ) {
      throw new Error(
        data.message ||
          "Unable to refresh cart prices."
      );
    }

    const updatedCart: CartItem[] =
      data.cart.map((row: any) => ({
        id: Number(row.product_id),
        name: String(
          row.name || "Product"
        ),
        price: formatStoredPrice(
          row.price
        ),
        image: String(
          row.image_url || ""
        ),
        quantity: Number(
          row.quantity
        ),
        currency: normalizeCurrency(
          row.currency
        ),
      }));

    const originalCart =
      cartRef.current;

    const changed =
      originalCart.length !==
        updatedCart.length ||
      updatedCart.some((item) => {
        const original =
          originalCart.find(
            (oldItem) =>
              oldItem.id === item.id
          );

        if (!original) return true;

        return (
          priceInCents(
            original.price
          ) !==
            priceInCents(
              item.price
            ) ||
          normalizeCurrency(
            original.currency
          ) !==
            normalizeCurrency(
              item.currency
            ) ||
          original.quantity !==
            item.quantity
        );
      });

    cartRef.current = updatedCart;
    setCart(updatedCart);

    return {
      changed,
      cart: updatedCart,
    };
  }

  // ===================================================
  // CLEAR CART
  // ===================================================

  function clearCart() {
    cartRef.current = [];
    setCart([]);

    localStorage.removeItem(
      STORAGE_KEY
    );

    const token =
      localStorage.getItem(
        "goldmart_token"
      );

    if (token) {
      fetch(`${API_URL}/api/cart`, {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }).catch((error) => {
        console.error(
          "Backend cart clear error:",
          error
        );
      });
    }
  }

  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCartFromServer,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// =====================================================
// USE CART
// =====================================================

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
