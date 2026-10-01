"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { sdk } from "./medusa";

export interface CartLineItem {
  id: string;              
  variantId: string;
  productId: string;
  title: string;
  thumbnail: string;
  price: number;           
  quantity: number;
  variantTitle?: string;
}

interface CartState {
  isOpen: boolean;
  items: CartLineItem[];
  cartId: string | null;
  isLoading: boolean;
  subtotal: number;
  discountTotal: number;
  medusaTotal: number | null;
  promoCodes: string[];
  freeShipping: boolean;
}

interface ApplyPromoResult {
  ok: boolean;
  error?: string;
  applied_rate?: number;
  creator_name?: string;
}

interface CartContextValue extends CartState {
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number, thumbnail?: string, title?: string, price?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, qty: number) => Promise<void>;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<ApplyPromoResult>;
  removePromoCode: (code: string) => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    isOpen: false,
    items: [],
    cartId: null,
    isLoading: false,
    subtotal: 0,
    discountTotal: 0,
    medusaTotal: null,
    promoCodes: [],
    freeShipping: false,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem("welfare_cart_id");
    if (savedCartId) {
      refreshCart(savedCartId);
    }
  }, []);

  const refreshCart = async (id: string) => {
    try {
      setState(s => ({ ...s, isLoading: true }));
      const { cart } = await sdk.store.cart.retrieve(id, {
        fields: "*items,*items.variant,*items.variant.product,*promotions,subtotal,discount_total,total,metadata",
      });

      const parsedItems = cart.items?.map((item: any) => ({
        id: item.id,
        variantId: item.variant_id,
        productId: item.variant?.product?.id || "",
        title: item.title,
        thumbnail: item.thumbnail || item.variant?.product?.thumbnail || "",
        price: item.unit_price,
        quantity: item.quantity,
        variantTitle: item.variant_title,
      })) || [];

      const promoCodes = ((cart as any).promotions || []).map((p: any) => p.code).filter(Boolean);

      setState(s => ({
        ...s,
        cartId: cart.id,
        items: parsedItems,
        isLoading: false,
        subtotal: Number((cart as any).subtotal || 0),
        discountTotal: Number((cart as any).discount_total || 0),
        medusaTotal: (cart as any).total != null ? Number((cart as any).total) : null,
        promoCodes,
        freeShipping: Boolean((cart as any).metadata?.creator_free_shipping),
      }));
      localStorage.setItem("welfare_cart_id", cart.id);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setState(s => ({ ...s, cartId: null, items: [], isLoading: false }));
      localStorage.removeItem("welfare_cart_id");
    }
  };

  const openCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: true }));
  }, []);

  const closeCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const addItem = useCallback(async (variantId: string, quantity: number, thumbnail?: string, title?: string, price?: number) => {
    try {
      setState(s => ({ ...s, isLoading: true }));
      
      let currentCartId = localStorage.getItem("welfare_cart_id");
      if (!currentCartId) {
        // Fetch regions first
        const { regions } = await sdk.store.region.list();
        const regionId = regions[0]?.id;

        const { cart } = await sdk.store.cart.create(regionId ? { region_id: regionId } : {});
        currentCartId = cart.id;
        localStorage.setItem("welfare_cart_id", currentCartId);
      }

      // Add line item
      await sdk.store.cart.createLineItem(currentCartId, {
        variant_id: variantId,
        quantity: quantity,
      });

      await refreshCart(currentCartId);
      openCart();
    } catch (err) {
      console.error("Failed to add item:", err);
      setState(s => ({ ...s, isLoading: false }));
      alert("Erreur lors de l'ajout au panier");
    }
  }, [openCart]);

  const removeItem = useCallback(async (lineId: string) => {
    const currentCartId = localStorage.getItem("welfare_cart_id");
    if (!currentCartId) return;
    try {
      setState(s => ({ ...s, isLoading: true }));
      await sdk.store.cart.deleteLineItem(currentCartId, lineId);
      await refreshCart(currentCartId);
    } catch (err) {
      console.error("Failed to remove item:", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const updateQuantity = useCallback(async (lineId: string, qty: number) => {
    const currentCartId = localStorage.getItem("welfare_cart_id");
    if (!currentCartId) return;
    try {
      if (qty <= 0) {
        await removeItem(lineId);
        return;
      }
      setState(s => ({ ...s, isLoading: true }));
      await sdk.store.cart.updateLineItem(currentCartId, lineId, { quantity: qty });
      await refreshCart(currentCartId);
    } catch (err) {
      console.error("Failed to update quantity:", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, [removeItem]);

  const clearCart = useCallback(() => {
    localStorage.removeItem("welfare_cart_id");
    setState(s => ({ ...s, items: [], cartId: null }));
  }, []);

  const applyPromoCode = useCallback(async (code: string): Promise<ApplyPromoResult> => {
    const currentCartId = localStorage.getItem("welfare_cart_id");
    if (!currentCartId || !code.trim()) return { ok: false, error: "Panier vide" };
    try {
      const result: any = await sdk.client.fetch("/store/creator/apply-code", {
        method: "POST",
        body: { cart_id: currentCartId, code: code.trim() },
      });
      await refreshCart(currentCartId);
      return { ok: true, applied_rate: result.applied_rate, creator_name: result.creator_name };
    } catch (err: any) {
      const message = err?.message || "Code invalide";
      return { ok: false, error: message };
    }
  }, []);

  const removePromoCode = useCallback(async (code: string) => {
    const currentCartId = localStorage.getItem("welfare_cart_id");
    if (!currentCartId) return;
    try {
      await sdk.store.cart.removePromotions(currentCartId, { promo_codes: [code] });
      await refreshCart(currentCartId);
    } catch (err) {
      console.error("Failed to remove promo code:", err);
    }
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
        applyPromoCode,
        removePromoCode,
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
