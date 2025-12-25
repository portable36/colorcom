import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CartProvider } from '../lib/cart';
import { WishlistProvider } from '../lib/wishlist';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="Colorcom storefront demo" />
          <title>Colorcom</title>
        </Head>
        <Component {...pageProps} />
      </WishlistProvider>
    </CartProvider>
  );
}
