"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CartLineItem {
  id: string;              // line item ID from Medusa
  variantId: string;
  productId: string;
  title: string;
  thumbnail: string;
  price: number;           // in smallest currency unit (e.g. FCFA)
  quantity: number;
  variantTitle?: string;
}

interface CartState {
  isOpen: boolean;
  items: CartLineItem[];
  cartId: string | null;
}

interface CartContextValue extends CartState {
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartLineItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    isOpen: false,
    items: [],
    cartId: null,
  });

  const openCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: true }));
  }, []);

  const closeCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const addItem = useCallback((newItem: Omit<CartLineItem, "id">) => {
    setState((s) => {
      // Check if item already in cart (by variantId)
      const existing = s.items.find((i) => i.variantId === newItem.variantId);
      let items: CartLineItem[];
      if (existing) {
        items = s.items.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      } else {
        const id = `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        items = [...s.items, { ...newItem, id }];
      }
      return { ...s, items, isOpen: true };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== id),
    }));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
    } else {
      setState((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
      }));
    }
  }, []);

  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, items: [], cartId: null }));
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
