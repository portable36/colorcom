import { OrderController } from '../src/infrastructure/controllers/order.controller';

const mockOrderService = {
  createOrder: jest.fn(),
};

describe('OrderController validation', () => {
  let controller: OrderController;

  beforeAll(() => {
    controller = new OrderController(mockOrderService as any);
  });

  beforeEach(() => jest.clearAllMocks());

  it('throws on empty cartItems', async () => {
    await expect(controller.createOrder('t1', 'u1', { cartItems: [] } as any)).rejects.toThrow();
  });

  it('throws when tenant header missing', async () => {
    await expect(controller.createOrder(undefined as any, 'u1', { cartItems: [{ productId: 'p1' }] } as any)).rejects.toThrow();
  });
});
