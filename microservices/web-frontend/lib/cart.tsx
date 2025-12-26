import React, { useContext, useEffect, useState } from 'react';

export type CartItem = {
  id: string; // unique id for cart entry (productId + options)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, string>;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Partial<CartItem> & { productId?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'colorcom_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      console.log('Restoring cart from localStorage:', raw);
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        // dedupe by id, summing quantities
        const map = new Map<string, CartItem>();
        for (const it of parsed) {
          if (map.has(it.id)) {
            const prev = map.get(it.id)!;
            prev.quantity += it.quantity;
            map.set(it.id, prev);
          } else {
            map.set(it.id, { ...it });
          }
        }
        setItems(Array.from(map.values()));
      }
    } catch (e) {
      console.warn('Failed to restore cart', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart', e);
    }
  }, [items]);

  function makeUid(productId: string, options?: Record<string, string>) {
    return `${productId}|${options ? encodeURIComponent(JSON.stringify(options)) : ''}`;
  }

  async function addItem(item: Partial<CartItem> & { productId?: string }) {
    // optimistic update
    setItems((cur) => {
      const productId = item.productId || (item as any).id;
      const options = item.options || undefined;
      const uid = makeUid(productId as string, options);
      const quantity = item.quantity || 1;
      const found = cur.find((c) => c.id === uid);
      if (found) {
        return cur.map((c) => (c.id === uid ? { ...c, quantity: c.quantity + quantity } : c));
      }
      return [
        ...cur,
        {
          id: uid,
          productId: productId as string,
          name: item.name || 'product',
          price: item.price || 0,
          quantity,
          options,
        } as CartItem,
      ];
    });

    // try to sync to server (best-effort)
    try {
      const userId = (window as any).__USER_ID__ || 'guest';
      await import('./api').then(({ syncAddToCart }) => syncAddToCart(userId, item));
    } catch (e) {
      console.warn('remote add failed', e);
    }
  }

  async function removeItem(id: string) {
    const item = items.find((i) => i.id === id);
    // optimistic removal
    setItems((cur) => cur.filter((c) => c.id !== id));
    // try remote delete
    try {
      if (!item) return;
      const userId = (window as any).__USER_ID__ || 'guest';
      await import('./api').then(({ syncRemoveFromCart }) => syncRemoveFromCart(userId, item.productId));
    } catch (e) {
      console.warn('remote remove failed', e);
    }
  }

  async function updateQuantity(id: string, quantity: number) {
    // optimistic update
    setItems((cur) => cur.map((c) => (c.id === id ? { ...c, quantity } : c)));
    // try to sync change to server (best-effort)
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const userId = (window as any).__USER_ID__ || 'guest';
      const productId = item.productId;
      await import('./api').then(({ syncUpdateCartItem }) => syncUpdateCartItem(userId, productId, { quantity }));
    } catch (e) {
      console.warn('remote update failed', e);
    }
  }

  async function clear() {
    setItems([]);
    try {
      const userId = (window as any).__USER_ID__ || 'guest';
      await import('./api').then(({ syncRemoveFromCart }) => syncRemoveFromCart(userId, ''));
    } catch (e) {
      // ignore
    }
  }

  async function updateItemOptions(id: string, options?: Record<string, string>, price?: number) {
    setItems((cur) => {
      const item = cur.find((c) => c.id === id);
      if (!item) return cur;
      const newId = makeUid(item.productId, options);
      const newItem: CartItem = { ...item, id: newId, options, price: price ?? item.price };
      // remove old and insert/update new
      const filtered = cur.filter((c) => c.id !== id);
      const found = filtered.find((c) => c.id === newId);
      if (found) {
        // merge quantities
        return filtered.map((c) => (c.id === newId ? { ...c, quantity: c.quantity + item.quantity, price: newItem.price } : c));
      }
      return [...filtered, newItem];
    });

    // try to sync change
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const userId = (window as any).__USER_ID__ || 'guest';
      await import('./api').then(({ syncUpdateCartItem }) => syncUpdateCartItem(userId, item.productId, { options, price }));
    } catch (e) {
      console.warn('remote update options failed', e);
    }
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
