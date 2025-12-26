import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const body = req.body;

  // SSLCommerz IPN sends fields including tran_id and val_id and status
  const tranId = body?.tran_id || body?.tran_id || body?.value_a || null;
  const status = body?.status || body?.card_issuer || 'INVALID';

  if (!tranId) return res.status(400).json({ error: 'Missing tran_id' });

  try {
    const ORDER_API = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3005';
    // Mark order as paid (best-effort). In production verify the IPN authenticity.
    await fetch(`${ORDER_API}/orders/${encodeURIComponent(tranId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'default' },
      body: JSON.stringify({ status: 'paid', metadata: { ipn: body } }),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('ipn handling error', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
