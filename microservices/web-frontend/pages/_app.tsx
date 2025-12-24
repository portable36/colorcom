import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CartProvider } from '../lib/cart';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
