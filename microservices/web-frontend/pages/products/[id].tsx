import React from 'react';
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
  const [selectedVar, setSelectedVar] = React.useState<any>(null);

  React.useEffect(() => {
    if (data && data.variations && data.variations.length > 0) setSelectedVar(data.variations[0]);
  }, [data]);

  if (error) return <Layout><div>Failed to load product</div></Layout>;
  if (!data) return <Layout><div>Loading…</div></Layout>;

  const computedPrice = selectedVar ? Math.round((data.price + (selectedVar.priceDelta || 0)) * 100) / 100 : data.price;

  return (
    <Layout>
      <article aria-labelledby="product-title">
        <h1 id="product-title" className="text-xl font-semibold">{data.name}</h1>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">{data.image ? <img src={data.image} alt={data.name} /> : 'No image'}</div>
          <div>
            <p className="mt-2 text-gray-700">{data.description}</p>
            <p className="mt-4 font-bold">${computedPrice}</p>

            {data.variations && data.variations.length > 0 && (
              <div className="mt-3">
                <label htmlFor="variation" className="block text-sm font-medium text-gray-700">Options</label>
                <select id="variation" className="mt-1 border rounded px-2 py-1" value={selectedVar?.id} onChange={(e) => setSelectedVar(data.variations.find((v: any) => v.id === e.target.value))}>
                  {data.variations.map((v: any) => <option key={v.id} value={v.id}>{v.label} {v.priceDelta ? `(+ $${v.priceDelta})` : ''}</option>)}
                </select>
              </div>
            )}

            <div className="mt-4">
              <button className="bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => addItem({ productId: data.id, name: data.name, price: computedPrice, quantity: 1, options: selectedVar ? { variant: selectedVar.label } : undefined })} aria-label={`Add ${data.name} to cart`}>Add to cart</button>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
}
