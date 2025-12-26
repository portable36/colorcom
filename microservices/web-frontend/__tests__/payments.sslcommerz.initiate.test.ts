import initiate from '../pages/api/payments/sslcommerz/initiate';
import { createMocks } from 'node-mocks-http';

describe('SSLCommerz initiate', () => {
  beforeEach(() => { jest.resetAllMocks(); (global as any).fetch = jest.fn(); process.env.SSLCOMMERZ_STORE_ID = 'store123'; process.env.SSLCOMMERZ_STORE_PASSWORD = 'pass123'; process.env.SSLCOMMERZ_SANDBOX = 'true'; });

  it('returns redirectUrl when order service and ssl respond', async () => {
    const fakeOrder = { id: 'order-123', finalTotal: 42 };
    // order service create (first fetch)
    (global as any).fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fakeOrder) }));
    // ssl endpoint (second fetch)
    (global as any).fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ GatewayPageURL: 'https://sandbox-gateway.example/pay' }) }));

    const { req, res } = createMocks({ method: 'POST', body: { items: [{ productId: 'p1', name: 'x', price: 42, quantity: 1 }], shippingAddress: { fullName: 'A' }, amount: 42 } });
    await initiate(req as any, res as any);
    if (res._getStatusCode() !== 200) {
      // show failure body for debugging
      console.error('Initiate failed response:', res._getStatusCode(), res._getData());
    }
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.redirectUrl).toBe('https://sandbox-gateway.example/pay');
  });
});
