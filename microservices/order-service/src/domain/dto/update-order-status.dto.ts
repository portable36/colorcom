export class UpdateOrderStatusDto {
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: 'UNPAID' | 'PAID' | 'FAILED';
  metadata?: Record<string, any>;
}
