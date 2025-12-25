import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/orders')
      .then((r) => r.json())
      .then((json) => { if (mounted) setOrders(json.data || json || []); })
      .catch(() => { if (mounted) setOrders([]); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Order history</h1>
      {loading && <p>Loading…</p>}
      {!loading && (!orders || orders.length === 0) && <p>No orders yet.</p>}
      <ul className="mt-4 space-y-3">
        {orders.map((o: any) => (
          <li key={o.id} className="border p-3 rounded">
            <div className="font-medium">Order: {o.id}</div>
            <div className="text-sm text-gray-600">Total: ${o.finalTotal}</div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
