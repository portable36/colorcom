import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // polling helper to retry a few times for eventual consistency
    async function load() {
      for (let i = 0; i < 5; i++) {
        try {
          const res = await fetch('/api/orders');
          if (!res.ok) throw new Error('network');
          const json = await res.json();
          const data = json.data || json || [];
          if (data && data.length > 0) {
            if (mounted) setOrders(data);
            return;
          }
          // wait and retry
          await new Promise((r) => setTimeout(r, 800));
        } catch (e) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
      // final attempt
      try {
        const res = await fetch('/api/orders');
        const json = await res.json();
        if (mounted) setOrders(json.data || json || []);
      } catch (_) {
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

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
