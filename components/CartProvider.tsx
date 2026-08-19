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
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // =====================================================
  // LOAD CART
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
  // SAVE CART
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "goldmart-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  function addToCart(
    item: Omit<CartItem, "quantity">
  ) {
    setCart((currentCart) => {
      const existing = currentCart.find(
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
                    product.quantity + 1,
                }
              : product
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
          currency:
            item.currency || "USD",
        },
      ];
    });
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
  }

  // =====================================================
  // CLEAR CART
  // =====================================================

  function clearCart() {
    setCart([]);
    localStorage.removeItem(
      "goldmart-cart"
    );
  }

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = cart.reduce(
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
