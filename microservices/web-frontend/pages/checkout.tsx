import Layout from '../components/Layout';
import { useCart } from '../lib/cart';
import { createOrder } from '../lib/api';
import { useState } from 'react';

export default function Checkout() {
  const { items, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function placeOrder() {
    setLoading(true);
    setResult(null);
    try {
      const payload = { cartItems: items.map((i) => ({ productId: i.id, quantity: i.quantity })) };
      const res = await createOrder(payload);
      setResult(res);
      clear();
    } catch (err: any) {
      setResult({ error: String(err.message || err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Checkout</h1>
      <div className="mt-4">Total: <span className="font-bold">${total.toFixed(2)}</span></div>
      <div className="mt-4">
        <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading || items.length===0} onClick={placeOrder}>
          {loading ? 'Placing order…' : 'Place order'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {items.length === 0 && <p className="mt-4">Your cart is empty.</p>}
    </Layout>
  );
}
