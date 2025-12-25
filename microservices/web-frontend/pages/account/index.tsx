import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Account() {
  return (
    <Layout>
      <h1 className="text-xl font-semibold">My Account</h1>
      <ul className="mt-4 space-y-2">
        <li><Link href="/account/orders" className="text-blue-600">Order history</Link></li>
        <li><Link href="/account/profile" className="text-blue-600">Profile (demo)</Link></li>
      </ul>
    </Layout>
  );
}
