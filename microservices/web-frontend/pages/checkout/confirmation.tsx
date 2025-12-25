import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Confirmation() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((j) => setOrder(j))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Order confirmation</h1>
      {loading && <p>Loading…</p>}
      {!loading && !order && <p>Order not found</p>}
      {order && (
        <div className="mt-4">
          <div className="font-medium">Order ID: {order.id}</div>
          <div className="mt-2">Total: ${order.finalTotal}</div>
          <div className="mt-4">
            <h2 className="font-medium">Items</h2>
            <ul className="mt-2 space-y-2">
              {order.items.map((it: any) => (
                <li key={it.id} className="border p-2 rounded">
                  <div>{it.name} — ${it.price} × {it.quantity}</div>
                  {it.metadata && <pre className="text-sm text-gray-600 whitespace-pre-wrap">{JSON.stringify(it.metadata, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
