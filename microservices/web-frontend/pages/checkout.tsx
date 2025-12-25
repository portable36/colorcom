import Layout from '../components/Layout';
import { useCart } from '../lib/cart';
import { createOrder } from '../lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Checkout() {
  const { items, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Allow seeding a demo cart by using ?seed=demo in the URL (helps deterministic e2e)
  const router = useRouter();
  const seedItems = (router && router.query && router.query.seed === 'demo') ? [{ id: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1 }] : null;

  const activeItems = (items && items.length > 0) ? items : (seedItems || []);
  const total = activeItems.reduce((s, i) => s + i.price * i.quantity, 0);

  async function placeOrder() {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        cartItems: items.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, vendorId: (i as any).vendorId || 'vendor-unknown' })),
        shippingAddress: { street: '123 Test St', city: 'Testville', state: 'TS', zipCode: '00000', country: 'Testland' },
      };
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
