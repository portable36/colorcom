import React, { useContext, useEffect, useState } from 'react';

export type WishlistItem = {
  id: string;
  name: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WishlistContext = React.createContext<WishlistContextValue | null>(null);
const KEY = 'colorcom_wishlist_v1';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items]);

  function add(item: WishlistItem) {
    setItems((cur) => (cur.find((c) => c.id === item.id) ? cur : [...cur, item]));
  }

  function remove(id: string) {
    setItems((cur) => cur.filter((c) => c.id !== id));
  }

  function clear() {
    setItems([]);
  }

  return <WishlistContext.Provider value={{ items, add, remove, clear }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
