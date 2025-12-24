import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../components/Layout';
import { fetchProduct } from '../../lib/api';
import { useCart } from '../../lib/cart';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, error } = useSWR(id ? ['product', id] : null, () => fetchProduct(String(id)));
  const { addItem } = useCart();

  if (error) return <Layout><div>Failed to load product</div></Layout>;
  if (!data) return <Layout><div>Loading…</div></Layout>;

  return (
    <Layout>
      <article aria-labelledby="product-title">
        <h1 id="product-title" className="text-xl font-semibold">{data.name}</h1>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">{data.image ? <img src={data.image} alt={data.name} /> : 'No image'}</div>
          <div>
            <p className="mt-2 text-gray-700">{data.description}</p>
            <p className="mt-4 font-bold">${data.price}</p>
            <div className="mt-4">
              <button className="bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => addItem({ id: data.id, name: data.name, price: data.price, quantity: 1 })} aria-label={`Add ${data.name} to cart`}>Add to cart</button>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
}
