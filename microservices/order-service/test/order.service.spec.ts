import { OrderService } from '../src/application/services/order.service';

const mockPrisma = {
  order: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
};

const mockKafka = {
  publishEvent: jest.fn(),
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService(mockPrisma as any, mockKafka as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an order and publishes event', async () => {
    const dto = {
      cartItems: [
        { productId: 'p1', price: 10, quantity: 2, vendorId: 'v1', name: 'Product 1' },
      ],
    } as any;

    const createdOrder = {
      id: 'o1',
      tenantId: 't1',
      userId: 'u1',
      finalTotal: 25,
      items: [{ productId: 'p1', price: 10, quantity: 2 }],
    };

    (mockPrisma.order.create as jest.Mock).mockResolvedValue(createdOrder);

    const res = await service.createOrder('t1', 'u1', dto);

    expect(mockPrisma.order.create).toHaveBeenCalled();
    expect(mockKafka.publishEvent).toHaveBeenCalledWith('order.created', expect.objectContaining({ orderId: 'o1' }));
    expect(res).toEqual(createdOrder);
  });

  it('calculates default totals when tax and shipping not provided', async () => {
    const dto = {
      cartItems: [
        { productId: 'p2', price: 20, quantity: 1 },
      ],
    } as any;
    const createdOrder = { id: 'o2', tenantId: 't1', userId: 'u2', finalTotal: 20 + Math.round(20 * 0.05 * 100) / 100 + 5, items: [{ productId: 'p2' }] };
    (mockPrisma.order.create as jest.Mock).mockResolvedValue(createdOrder);

    const res = await service.createOrder('t1', 'u2', dto);
    expect(res).toEqual(createdOrder);
  });
});
