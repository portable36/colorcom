const API = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_API = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3005';

export async function fetchProducts() {
  const res = await fetch(`${API}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProduct(id: string) {
  const res = await fetch(`${API}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createOrder(payload: any) {
  const res = await fetch(`${ORDER_API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Order creation failed: ${res.status} ${text}`);
  }
  return res.json();
}
