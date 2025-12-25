import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { fetchProducts } from '../../lib/api';
import { useCart } from '../../lib/cart';

export default function Products() {
  const { data, error } = useSWR('products', fetchProducts);
  const { addItem } = useCart();

  const fallback = [
    { id: 'prod-1', name: 'Red T-Shirt', description: 'Comfortable cotton tee', price: 19.99 },
    { id: 'prod-2', name: 'Blue Mug', description: 'Ceramic mug', price: 9.99 },
  ];

  const items = data || fallback;
  if (!data && !error) console.log('Products loading, showing fallback');
  if (!data) console.log('Using fallback products');

  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-4">Products</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p: any) => (
          <li key={p.id} className="border p-4 rounded bg-white shadow-sm">
            <div className="h-40 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-500 text-sm" role="img" aria-label={p.image ? `${p.name} image` : `Placeholder image for ${p.name}`}>
              {p.image ? <img src={p.image} alt={p.name} className="max-h-full" /> : 'No image'}
            </div>
            <h2 className="font-medium">{p.name}</h2>
            <p className="text-sm text-gray-600">{p.description}</p>
            <div className="mt-2 font-bold">${p.price}</div>
            <div className="mt-2 flex items-center gap-2">
              <Link href={`/products/${p.id}`} className="text-blue-600" aria-label={`View ${p.name}`}>View</Link>
              <button
                className="ml-2 bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                onClick={() => addItem({ id: p.id, name: p.name, price: p.price, quantity: 1 })}
                aria-label={`Add ${p.name} to cart`}
              >Add to cart</button>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
