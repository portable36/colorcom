import React, { useContext, useEffect, useState } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
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
      if (raw) setItems(JSON.parse(raw));
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

  function addItem(item: CartItem) {
    setItems((cur) => {
      const found = cur.find((c) => c.id === item.id);
      if (found) {
        return cur.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c));
      }
      return [...cur, item];
    });
  }

  function removeItem(id: string) {
    setItems((cur) => cur.filter((c) => c.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((cur) => cur.map((c) => (c.id === id ? { ...c, quantity } : c)));
  }

  function clear() {
    setItems([]);
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
