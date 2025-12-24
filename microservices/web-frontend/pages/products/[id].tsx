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
      <h1 className="text-xl font-semibold">{data.name}</h1>
      <p className="mt-2">{data.description}</p>
      <p className="mt-4 font-bold">${data.price}</p>
      <div className="mt-4">
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => addItem({ id: data.id, name: data.name, price: data.price, quantity: 1 })}>Add to cart</button>
      </div>
    </Layout>
  );
}
