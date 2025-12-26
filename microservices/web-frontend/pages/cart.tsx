import Layout from '../components/Layout';
import { useCart } from '../lib/cart';
import Link from 'next/link';
import CartRow from '../components/CartRow';

export default function Cart() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <Layout>
        <h1 className="text-xl font-semibold">Cart</h1>
        <p className="mt-4">Your cart is empty.</p>
        <p className="mt-4"><Link href="/products" className="text-blue-600">Browse products</Link></p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Cart</h1>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <CartRow key={it.id} item={it} updateQuantity={updateQuantity} removeItem={removeItem} updateItemOptions={updateItemOptions} />
        ))}
      </ul>

      <div className="mt-6 flex justify-between items-center">
        <div className="font-bold">Total: ${total.toFixed(2)}</div>
        <div className="flex gap-2">
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => clear()}>Clear</button>
          <Link href="/checkout" className="bg-blue-600 text-white px-3 py-1 rounded">Proceed to Checkout</Link>
        </div>
      </div>
    </Layout>
  );
}
