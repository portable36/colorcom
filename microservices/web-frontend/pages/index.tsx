import Link from 'next/link';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-4">Welcome to Colorcom</h1>
      <p className="mb-6">Quick links</p>
      <ul className="list-disc pl-6">
        <li><Link href="/products">Browse products</Link></li>
        <li><Link href="/cart">View cart</Link></li>
      </ul>
    </Layout>
  );
}
