"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
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
  pendingPromoCode: string | null;
  freeShipping: boolean;
  // false until the saved cart is loaded: before that, `items` is empty but the cart may not be
  hydrated: boolean;
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
  // metadata is stored on the line item and kept on the order (e.g. { source: "skin_coach", scan_id })
  // resolves to false when the item could not be added (the error was already shown)
  addItem: (variantId: string, quantity: number, thumbnail?: string, title?: string, price?: number, metadata?: Record<string, unknown>) => Promise<boolean>;
  // adds one of each variant that is not already in the cart (after the saved cart is loaded), with one
  // refresh and one opening of the cart at the end; resolves to the variants that were added
  addMissingItems: (variantIds: string[], metadata?: Record<string, unknown>) => Promise<string[] | null>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, qty: number) => Promise<void>;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<ApplyPromoResult>;
  removePromoCode: (code: string) => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CART_FIELDS = "*items,*items.variant,*items.variant.product,*promotions,subtotal,discount_total,total,metadata,completed_at";

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
    pendingPromoCode: null,
    freeShipping: false,
    hydrated: false,
  });

  // latest items, for the async adds (the state seen by a callback can be stale after an await)
  const itemsRef = useRef<CartLineItem[]>([]);
  itemsRef.current = state.items;
  const hydratedRef = useRef<Promise<void> | null>(null);
  const markHydrated = useRef<() => void>(() => {});
  if (!hydratedRef.current) hydratedRef.current = new Promise<void>((resolve) => { markHydrated.current = resolve; });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem("welfare_cart_id");
    const done = () => {
      setState(s => ({ ...s, hydrated: true }));
      markHydrated.current();
    };
    if (savedCartId) {
      refreshCart(savedCartId).finally(done);
    } else {
      done();
    }
  }, []);

  const refreshCart = async (id: string) => {
    try {
      setState(s => ({ ...s, isLoading: true }));
      const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
      applyCart(cart);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setState(s => ({ ...s, cartId: null, items: [], isLoading: false }));
      localStorage.removeItem("welfare_cart_id");
    }
  };

  const applyCart = (cart: any) => {
    // A cart already turned into an order (e.g. completed outside this browser, or the page was closed
    // right after payment) can no longer be changed: start from an empty cart instead of failing
    if ((cart as any).completed_at) {
      setState(s => ({ ...s, cartId: null, items: [], isLoading: false, subtotal: 0, discountTotal: 0, medusaTotal: null, promoCodes: [], pendingPromoCode: null, freeShipping: false }));
      localStorage.removeItem("welfare_cart_id");
      itemsRef.current = [];
      return;
    }

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
      pendingPromoCode: (cart as any).metadata?.pending_promo_code || null,
      freeShipping: Boolean((cart as any).metadata?.creator_free_shipping),
    }));
    itemsRef.current = parsedItems;
    localStorage.setItem("welfare_cart_id", cart.id);
  };

  const openCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: true }));
  }, []);

  const closeCart = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const createCart = async () => {
    // Fetch regions first
    const { regions } = await sdk.store.region.list();
    const regionId = regions[0]?.id;

    const { cart } = await sdk.store.cart.create(regionId ? { region_id: regionId } : {});
    localStorage.setItem("welfare_cart_id", cart.id);
    return cart.id;
  };

  // Adds the line items one after the other on the saved cart (a new one if it was already turned into
  // an order), then shows the cart returned by the last add: no extra request to read it again
  const addLines = async (lines: { variantId: string; quantity: number }[], metadata?: Record<string, unknown>) => {
    let currentCartId = localStorage.getItem("welfare_cart_id") || await createCart();
    let cart: any = null;
    for (const line of lines) {
      const body = { variant_id: line.variantId, quantity: line.quantity, ...(metadata ? { metadata } : {}) };
      try {
        ({ cart } = await sdk.store.cart.createLineItem(currentCartId, body, { fields: CART_FIELDS }));
      } catch (e: any) {
        if (!/already completed/i.test(e?.message || "")) throw e;
        currentCartId = await createCart();
        ({ cart } = await sdk.store.cart.createLineItem(currentCartId, body, { fields: CART_FIELDS }));
      }
    }
    // the fields asked for come back with the cart; if not (older API), read it again
    if (cart?.items && (cart.items.length === 0 || cart.items[0].variant !== undefined)) applyCart(cart);
    else await refreshCart(currentCartId);
  };

  const addItem = useCallback(async (variantId: string, quantity: number, thumbnail?: string, title?: string, price?: number, metadata?: Record<string, unknown>) => {
    try {
      setState(s => ({ ...s, isLoading: true }));
      await addLines([{ variantId, quantity }], metadata);
      openCart();
      return true;
    } catch (err) {
      console.error("Failed to add item:", err);
      setState(s => ({ ...s, isLoading: false }));
      alert("Erreur lors de l'ajout au panier");
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCart]);

  const addMissingItems = useCallback(async (variantIds: string[], metadata?: Record<string, unknown>) => {
    try {
      await hydratedRef.current;
      const inCart = new Set(itemsRef.current.map((i) => i.variantId));
      const missing = Array.from(new Set(variantIds)).filter((id) => !inCart.has(id));
      if (missing.length) {
        setState(s => ({ ...s, isLoading: true }));
        await addLines(missing.map((variantId) => ({ variantId, quantity: 1 })), metadata);
      }
      openCart();
      return missing;
    } catch (err) {
      console.error("Failed to add items:", err);
      // some lines may have been added before the failure: show the cart as it really is
      const id = localStorage.getItem("welfare_cart_id");
      if (id) await refreshCart(id);
      else setState(s => ({ ...s, isLoading: false }));
      alert("Erreur lors de l'ajout au panier");
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // A parked free-shipping code isn't attached to the cart yet, so there may be nothing to detach
      await sdk.store.cart.removePromotions(currentCartId, { promo_codes: [code] }).catch(() => {});
      await sdk.store.cart.update(currentCartId, { metadata: { pending_promo_code: null } });
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
        addMissingItems,
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
