import Layout from '../components/Layout';
import { useWishlist } from '../lib/wishlist';

export default function Wishlist() {
  const { items, remove, clear } = useWishlist();

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Wishlist</h1>
      <ul className="mt-4 space-y-3">
        {items.length === 0 && <p>Your wishlist is empty.</p>}
        {items.map((i) => (
          <li key={i.id} className="border p-3 rounded flex justify-between items-center">
            <div>{i.name}</div>
            <div className="flex gap-2">
              <button className="text-sm text-blue-600" onClick={() => remove(i.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      {items.length > 0 && <div className="mt-4"><button className="bg-red-600 text-white px-3 py-1 rounded" onClick={clear}>Clear wishlist</button></div>}
    </Layout>
  );
}
