import Layout from '../../../../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

async function fetchWithRetry(url: string, attempts = 3, delay = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network');
      return await res.json();
    } catch (e) {
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delay));
      else throw e;
    }
  }
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchWithRetry(`/api/orders/${id}`, 3, 700)
      .then((j) => setOrder(j))
      .catch((e: any) => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Order detail</h1>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="mt-4">
          <p className="text-sm text-red-600">{error}</p>
          <button className="mt-2 bg-gray-200 px-3 py-1 rounded" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {order && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Order ID: <span className="font-mono">{order.id}</span></div>
            <div>
              <button className="text-sm text-gray-600 mr-2" onClick={() => navigator.clipboard?.writeText(order.id)}>Copy ID</button>
              <a className="text-sm text-blue-600" href="/account/orders">Back to orders</a>
            </div>
          </div>

          <div className="mt-2">Total: ${order.finalTotal}</div>

          {order.shippingAddress && (
            <div className="mt-4">
              <h2 className="font-medium">Shipping</h2>
              <div className="text-sm text-gray-600">{order.shippingAddress.fullName}<br />{order.shippingAddress.street}<br />{order.shippingAddress.city} {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />{order.shippingAddress.country}</div>
            </div>
          )}

          <div className="mt-4">
            <h2 className="font-medium">Items</h2>
            <ul className="mt-2 space-y-2">
              {order.items.map((it: any) => (
                <li key={it.id} className="border p-2 rounded">
                  <div className="font-medium">{it.name} — ${it.price} × {it.quantity}</div>
                  {it.metadata && <pre className="text-sm text-gray-600 whitespace-pre-wrap">{JSON.stringify(it.metadata, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h2 className="font-medium">Status</h2>
            <div className="text-sm text-gray-600">{order.status || 'received'}</div>
          </div>
        </div>
      )}
    </Layout>
  );
}
