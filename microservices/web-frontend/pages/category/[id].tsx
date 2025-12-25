import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';
import { fetchProducts } from '../../lib/api';
import Link from 'next/link';

export default function Category({ id, products }: any) {
  return (
    <Layout>
      <h1 className="text-xl font-semibold">Category: {id}</h1>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => (
          <li key={p.id} className="border p-4 rounded bg-white shadow-sm">
            <h2 className="font-medium">{p.name}</h2>
            <p className="text-sm text-gray-600">{p.description}</p>
            <div className="mt-2 font-bold">${p.price}</div>
            <Link href={`/products/${p.id}`} className="text-blue-600">View</Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.params as any;
  const products = await fetchProducts();
  // naive filter by name containing category id for demo purposes
  const filtered = (products || []).filter((p: any) => p.name.toLowerCase().includes((id || '').toLowerCase()));
  return { props: { id, products: filtered } };
};
