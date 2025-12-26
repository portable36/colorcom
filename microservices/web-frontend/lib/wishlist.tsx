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

    // Cross-tab sync via BroadcastChannel when available
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('colorcom:wishlist');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'update' && ev.data.items) {
          setItems(ev.data.items);
        }
      };
    }

    // Fallback: storage event
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === KEY && ev.newValue) {
        try {
          setItems(JSON.parse(ev.newValue));
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      // broadcast update
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc2 = new BroadcastChannel('colorcom:wishlist');
        bc2.postMessage({ type: 'update', items });
        bc2.close();
      } else {
        // fallback: bump a timestamp key to trigger storage event
        localStorage.setItem(`${KEY}:updatedAt`, Date.now().toString());
      }
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
