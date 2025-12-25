import { OrderController } from '../src/infrastructure/controllers/order.controller';
import { OrderService } from '../src/application/services/order.service';

const mockOrderService = {
  createOrder: jest.fn(),
  listOrders: jest.fn(),
  getOrder: jest.fn(),
};

describe('OrderController (unit)', () => {
  let controller: OrderController;

  beforeAll(() => {
    controller = new OrderController(mockOrderService as any);
  });

  beforeEach(() => jest.clearAllMocks());

  it('throws BadRequest when tenant header missing', async () => {
    await expect(
      controller.createOrder(undefined as any, 'u1', { cartItems: [{ productId: 'p1', quantity: 1 }] } as any),
    ).rejects.toThrow();
  });

  it('calls service when headers present', async () => {
    (mockOrderService.createOrder as jest.Mock).mockResolvedValue({ id: 'o1' });

    const res = await controller.createOrder('t1', 'u1', { cartItems: [{ productId: 'p1', quantity: 1 }] } as any);
    expect(mockOrderService.createOrder).toHaveBeenCalledWith('t1', 'u1', expect.any(Object));
    expect(res).toEqual({ id: 'o1' });
  });
});
