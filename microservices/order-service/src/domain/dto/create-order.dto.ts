export class CreateOrderDto {
  cartItems: Array<{
    productId: string;
    vendorId: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  taxAmount?: number;
  shippingFee?: number;
}
