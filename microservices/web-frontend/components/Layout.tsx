import React from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>Colorcom Storefront</div>
          <nav>
            <Link href="/products" className="mr-4">Products</Link>
            <Link href="/cart">Cart ({count})</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t py-4 text-center">© Colorcom</footer>
    </div>
  );
}
