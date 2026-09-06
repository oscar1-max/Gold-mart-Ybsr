"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  currency?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // =====================================================
  // LOAD LOCAL CART
  // =====================================================

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem("goldmart-cart");

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );

      localStorage.removeItem("goldmart-cart");
    }
  }, []);

  // =====================================================
  // SAVE LOCAL CART
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "goldmart-cart",
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event("goldmart-cart-updated")
    );
  }, [cart]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  function addToCart(
    item: Omit<CartItem, "quantity">,
    quantity = 1
  ) {
    if (quantity < 1) {
      quantity = 1;
    }

    setCart((currentCart) => {
      const existing =
        currentCart.find(
          (product) =>
            product.id === item.id
        );

      if (existing) {
        return currentCart.map(
          (product) =>
            product.id === item.id
              ? {
                  ...product,
                  quantity:
                    product.quantity +
                    quantity,
                }
              : product
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity,
          currency:
            item.currency ||
            "USD",
        },
      ];
    });

    // ===================================================
    // SYNC WITH BACKEND WHEN LOGGED IN
    // ===================================================

    try {
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
            quantity,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const data =
                await response
                  .json()
                  .catch(() => null);

              console.error(
                "Backend cart sync failed:",
                data?.message ||
                  "Unable to add product to backend cart"
              );
            }
          })
          .catch((error) => {
            console.error(
              "Backend cart sync error:",
              error
            );
          });
      }
    } catch (error) {
      console.error(
        "Cart authentication error:",
        error
      );
    }
  }

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  function removeFromCart(id: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (product) =>
          product.id !== id
      )
    );

    try {
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
            "Backend remove cart error:",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "Remove cart error:",
        error
      );
    }
  }

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  function updateQuantity(
    id: number,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) =>
      currentCart.map(
        (product) =>
          product.id === id
            ? {
                ...product,
                quantity,
              }
            : product
      )
    );

    // The checkout sync endpoint will
    // make the database quantity authoritative.
  }

  // =====================================================
  // CLEAR CART
  // =====================================================

  function clearCart() {
    setCart([]);

    localStorage.removeItem(
      "goldmart-cart"
    );

    try {
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
            "Backend clear cart error:",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "Clear cart error:",
        error
      );
    }
  }

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount =
    cart.reduce(
      (total, product) =>
        total + product.quantity,
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
