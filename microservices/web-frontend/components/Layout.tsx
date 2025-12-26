import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect } from 'react';
import { useCart } from '../lib/cart';
import { useSettings } from '../lib/useSettings';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;
    if (settings.title) document.title = settings.title;
    if (settings.brandColor) document.documentElement.style.setProperty('--color-brand', settings.brandColor);
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        {settings?.favicon ? <link rel="icon" href={settings.favicon} /> : null}
      </Head>
      <header className="header-brand border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold" aria-label="Colorcom Storefront">{settings?.title ?? 'Colorcom'}</h1>
          <nav aria-label="Main navigation">
            <Link href="/products" className="mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Products">Products</Link>
            <Link href="/search" className="mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Search">Search</Link>
            <Link href="/wishlist" className="mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Wishlist">Wishlist</Link>
            <Link href="/account" className="mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Account">Account</Link>
            <Link href="/cart" className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`Cart, ${count} items`}>Cart ({count})</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t py-4 text-center text-sm">©2025 Colorfifty | All Rights Reserved | Proudly from BANGLADESH</footer>
    </div>
  );
}
