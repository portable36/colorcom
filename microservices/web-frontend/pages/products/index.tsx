import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { fetchProducts } from '../../lib/api';

export default function Products() {
  const { data, error } = useSWR('products', fetchProducts);
  const { addItem } = useCart();

  if (error) return <Layout><div>Failed to load products</div></Layout>;
  if (!data) return <Layout><div>Loading…</div></Layout>;

  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-4">Products</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((p: any) => (
          <li key={p.id} className="border p-4 rounded">
            <h2 className="font-medium">{p.name}</h2>
            <p className="text-sm text-gray-600">{p.description}</p>
            <div className="mt-2 font-bold">${p.price}</div>
            <div className="mt-2 flex items-center gap-2">
              <Link href={`/products/${p.id}`} className="text-blue-600">View</Link>
              <button
                className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => addItem({ id: p.id, name: p.name, price: p.price, quantity: 1 })}
              >Add to cart</button>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
