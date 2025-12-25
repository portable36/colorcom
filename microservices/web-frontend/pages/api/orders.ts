import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ORDER_API = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3005';
    const url = `${ORDER_API}/orders`;
    const headers: any = {
      'x-tenant-id': 'default',
      'x-user-id': 'guest',
    };

    const fetchRes = await fetch(url, { headers });
    const json = await fetchRes.json();
    res.status(fetchRes.status).json(json);
  } catch (e) {
    res.status(500).json({ data: [] });
  }
}
