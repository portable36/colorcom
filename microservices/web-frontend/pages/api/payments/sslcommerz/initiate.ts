import type { NextApiRequest, NextApiResponse } from 'next';

const SSLCOMMERZ_SANDBOX_URL = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
const SSLCOMMERZ_LIVE_URL = 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { items, shippingAddress, amount, customerEmail } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });

  const ORDER_API = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3005';

  try {
    // Create order in order-service (status pending)
    const getFetch = () => (typeof fetch !== 'undefined' ? fetch : require('node-fetch'));
    const createRes = await getFetch()(`${ORDER_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'default', 'x-user-id': 'guest' },
      body: JSON.stringify({ cartItems: items, shippingAddress, payment: { method: 'sslcommerz' } }),
    });

    if (!createRes.ok) {
      const txt = await createRes.text().catch(() => '');
      return res.status(502).json({ error: `Order service error: ${createRes.status} ${txt}` });
    }

    const order = await createRes.json();

    // Prepare SSLCommerz payload
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
    if (!storeId || !storePass) return res.status(500).json({ error: 'SSLCommerz credentials not configured' });

    const isSandbox = String(process.env.SSLCOMMERZ_SANDBOX || 'true') === 'true';
    const endpoint = isSandbox ? SSLCOMMERZ_SANDBOX_URL : SSLCOMMERZ_LIVE_URL;

    const payload = new URLSearchParams();
    payload.append('store_id', storeId);
    payload.append('store_passwd', storePass);
    payload.append('total_amount', String(amount || order.finalTotal || 0));
    payload.append('currency', 'BDT');
    payload.append('tran_id', String(order.id));

    const ipnUrl = process.env.SSLCOMMERZ_IPN_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/payments/sslcommerz/ipn`;
    const successUrl = process.env.SSLCOMMERZ_RETURN_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/checkout/confirmation`;
    payload.append('success_url', successUrl + `?orderId=${order.id}`);
    payload.append('fail_url', successUrl + `?orderId=${order.id}&status=fail`);
    payload.append('cancel_url', successUrl + `?orderId=${order.id}&status=cancel`);
    payload.append('ipn_url', ipnUrl);

    // Customer info
    payload.append('cus_name', shippingAddress?.fullName || 'Customer');
    payload.append('cus_email', customerEmail || 'customer@example.com');
    payload.append('cus_add1', shippingAddress?.street || '');
    payload.append('cus_city', shippingAddress?.city || '');
    payload.append('cus_country', shippingAddress?.country || 'BD');

    const sslRes = await getFetch()(endpoint, { method: 'POST', body: payload });
    if (!sslRes.ok) return res.status(502).json({ error: 'SSLCommerz request failed' });

    const sslJson = await sslRes.json().catch(() => null);
    // SSLCommerz returns gateway page url in GatewayPageURL
    const redirectUrl = sslJson?.GatewayPageURL || sslJson?.gateway_page_url || null;

    if (!redirectUrl) return res.status(502).json({ error: 'No redirect URL from SSLCommerz', detail: sslJson });

    return res.status(200).json({ redirectUrl, order });
  } catch (e: any) {
    console.error('sslcommerz initiate error', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
