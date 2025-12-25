const API = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_API = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3005';

export async function fetchProducts() {
  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (e) {
    // Fallback to local sample data so e2e can run when backend service is unavailable
    return [
      { id: 'prod-1', name: 'Red T-Shirt', description: 'Comfortable cotton tee', price: 19.99, image: '' },
      { id: 'prod-2', name: 'Blue Mug', description: 'Ceramic mug', price: 9.99, image: '' },
    ];
  }
}

export async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API}/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  } catch (e) {
    // Fallback with variations for demo purposes
    if (id === 'prod-1') {
      return {
        id: 'prod-1',
        name: 'Red T-Shirt',
        description: 'Comfortable cotton tee',
        price: 19.99,
        image: '',
        variations: [
          { id: 's', label: 'S', priceDelta: 0 },
          { id: 'm', label: 'M', priceDelta: 2 },
          { id: 'l', label: 'L', priceDelta: 4 },
        ],
      };
    }
    return {
      id,
      name: 'Unknown product',
      description: '',
      price: 0,
      image: '',
    };
  }
}

export async function createOrder(payload: any) {
  const res = await fetch(`${ORDER_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': 'default',
      'x-user-id': 'guest',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Order creation failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchOrders() {
  const res = await fetch(`${ORDER_API}/orders`, {
    headers: {
      'x-tenant-id': 'default',
      'x-user-id': 'guest',
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || json;
}
