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
  const stock = selectedVar?.stock ?? data.stock ?? null;

  return (
    <Layout>
      <article aria-labelledby="product-title">
        <h1 id="product-title" className="text-xl font-semibold">{data.name}</h1>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">
            {selectedVar?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedVar.image} alt={`${data.name} — ${selectedVar.label}`} className="object-cover w-full h-full" />
            ) : data.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt={data.name} className="object-cover w-full h-full" />
            ) : (
              'No image'
            )}
          </div>
          <div>
            <p className="mt-2 text-gray-700">{data.description}</p>
            <p className="mt-4 font-bold"><span aria-live="polite" id="price">${computedPrice}</span></p>

            {data.variations && data.variations.length > 0 && (
              <div className="mt-3">
                <div className="block text-sm font-medium text-gray-700">Options</div>

                <div role="radiogroup" aria-label="Product options" className="mt-2 flex gap-2" onKeyDown={(e) => {
                  // keyboard left/right navigation for options
                  const idx = data.variations.findIndex((v: any) => v.id === selectedVar?.id)
                  if (idx === -1) return
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    const next = data.variations[(idx + 1) % data.variations.length]
                    setSelectedVar(next)
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    const prev = data.variations[(idx - 1 + data.variations.length) % data.variations.length]
                    setSelectedVar(prev)
                  }
                }}>
                  {data.variations.map((v: any) => (
                    <button key={v.id} role="radio" aria-checked={selectedVar?.id === v.id} aria-label={`Choose ${v.label}`} className={`px-3 py-1 border rounded ${selectedVar?.id === v.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`} onClick={() => setSelectedVar(v)}>
                      <div className="text-sm font-medium">{v.label}</div>
                      {v.priceDelta ? <div className="text-xs text-gray-500">+${v.priceDelta}</div> : null}
                      {v.stock !== undefined ? <div className={`text-xs ${v.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{v.stock > 0 ? 'In stock' : 'Out of stock'}</div> : null}
                    </button>
                  ))}
                </div>

                <label htmlFor="variation" className="sr-only">Options select</label>
                <select id="variation" aria-hidden className="hidden" value={selectedVar?.id} onChange={(e) => setSelectedVar(data.variations.find((v: any) => v.id === e.target.value))}>
                  {data.variations.map((v: any) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
            )}

            {stock !== null && (
              <p className="mt-2 text-sm" aria-live="polite">{stock > 0 ? `${stock} available` : 'Out of stock'}</p>
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
