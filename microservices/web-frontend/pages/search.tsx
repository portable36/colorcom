import Layout from '../components/Layout';
import { fetchProducts } from '../lib/api';
import { useState } from 'react';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch() {
    setLoading(true);
    try {
      const list = await fetchProducts();
      setResults(list.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase())));
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Search</h1>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="border px-2 py-1 flex-1" placeholder="Search products" />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={doSearch} disabled={!q || loading}>{loading ? 'Searching…' : 'Search'}</button>
      </div>

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p: any) => (
          <li key={p.id} className="border p-4 rounded bg-white shadow-sm">
            <h2 className="font-medium">{p.name}</h2>
            <p className="text-sm text-gray-600">{p.description}</p>
            <div className="mt-2 font-bold">${p.price}</div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
