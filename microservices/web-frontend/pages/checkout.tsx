import Layout from '../components/Layout';
import { useCart } from '../lib/cart';
import { createOrder } from '../lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type Shipping = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type Payment = {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

function validateShipping(s: Shipping) {
  const errors: Record<string,string> = {};
  if (!s.fullName) errors.fullName = 'Full name is required';
  if (!s.street) errors.street = 'Street is required';
  if (!s.city) errors.city = 'City is required';
  if (!s.zipCode) errors.zipCode = 'Zip/postal code is required';
  if (!s.country) errors.country = 'Country is required';
  return errors;
}

function validatePayment(p: Payment) {
  const errors: Record<string,string> = {};
  if (!p.nameOnCard) errors.nameOnCard = 'Name on card is required';
  if (!/^[0-9]{13,19}$/.test(p.cardNumber.replace(/\s+/g, ''))) errors.cardNumber = 'Card number looks invalid';
  if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(p.expiry)) errors.expiry = 'Expiry should be MM/YY';
  if (!/^[0-9]{3,4}$/.test(p.cvv)) errors.cvv = 'CVV should be 3 or 4 digits';
  return errors;
}

export default function Checkout() {
  const { items, clear } = useCart();
  const router = useRouter();

  const seedItems = (router && router.query && router.query.seed === 'demo') ? [{ id: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1 }] : null;
  const activeItems = (items && items.length > 0) ? items : (seedItems || []);
  const total = activeItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState<Shipping>({ fullName: '', street: '', city: '', state: '', zipCode: '', country: '' });
  const [payment, setPayment] = useState<Payment>({ nameOnCard: '', cardNumber: '', expiry: '', cvv: '' });
  const [shippingErrors, setShippingErrors] = useState<Record<string,string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [step]);

  function nextStep() {
    if (step === 0) {
      const errs = validateShipping(shipping);
      setShippingErrors(errs);
      if (Object.keys(errs).length) return;
    }
    if (step === 1) {
      const errs = validatePayment(payment);
      setPaymentErrors(errs);
      if (Object.keys(errs).length) return;
    }
    setStep((s) => s + 1);
  }

  function prevStep() { setStep((s) => Math.max(0, s - 1)); }

  async function placeOrder() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        cartItems: activeItems.map((i) => ({ productId: (i as any).productId || (i as any).id, name: i.name, price: i.price, quantity: i.quantity, vendorId: (i as any).vendorId || 'vendor-unknown', options: (i as any).options || undefined })),
        shippingAddress: shipping,
        payment: { nameOnCard: payment.nameOnCard.replace(/\*/g, ''), method: 'card' },
      };
      const res = await createOrder(payload);
      clear();
      if (res && res.id) router.push(`/checkout/confirmation?id=${res.id}`);
    } catch (err: any) {
      setErrorMessage(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold">Checkout</h1>
      <div className="mt-4 max-w-2xl">
        <div className="mb-4 text-sm text-gray-600">Progress: {step + 1} / 3</div>

        {step === 0 && (
          <section aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="font-medium">Shipping information</h2>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="block">
                <div className="text-sm">Full name</div>
                <input className={`w-full border rounded px-2 py-1 ${shippingErrors.fullName ? 'border-red-600' : ''}`} value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} aria-invalid={!!shippingErrors.fullName} />
                {shippingErrors.fullName && <div className="text-xs text-red-600" role="alert">{shippingErrors.fullName}</div>}
              </label>
              <label className="block">
                <div className="text-sm">Street</div>
                <input className={`w-full border rounded px-2 py-1 ${shippingErrors.street ? 'border-red-600' : ''}`} value={shipping.street} onChange={(e) => setShipping({ ...shipping, street: e.target.value })} aria-invalid={!!shippingErrors.street} />
                {shippingErrors.street && <div className="text-xs text-red-600" role="alert">{shippingErrors.street}</div>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-sm">City</div>
                  <input className={`w-full border rounded px-2 py-1 ${shippingErrors.city ? 'border-red-600' : ''}`} value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} aria-invalid={!!shippingErrors.city} />
                  {shippingErrors.city && <div className="text-xs text-red-600" role="alert">{shippingErrors.city}</div>}
                </label>
                <label className="block">
                  <div className="text-sm">State</div>
                  <input className={`w-full border rounded px-2 py-1`} value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-sm">Zip / Postal</div>
                  <input className={`w-full border rounded px-2 py-1 ${shippingErrors.zipCode ? 'border-red-600' : ''}`} value={shipping.zipCode} onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })} aria-invalid={!!shippingErrors.zipCode} />
                  {shippingErrors.zipCode && <div className="text-xs text-red-600" role="alert">{shippingErrors.zipCode}</div>}
                </label>
                <label className="block">
                  <div className="text-sm">Country</div>
                  <input className={`w-full border rounded px-2 py-1 ${shippingErrors.country ? 'border-red-600' : ''}`} value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} aria-invalid={!!shippingErrors.country} />
                  {shippingErrors.country && <div className="text-xs text-red-600" role="alert">{shippingErrors.country}</div>}
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={nextStep}>Continue to payment</button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-medium">Payment</h2>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="block">
                <div className="text-sm">Name on card</div>
                <input className={`w-full border rounded px-2 py-1 ${paymentErrors.nameOnCard ? 'border-red-600' : ''}`} value={payment.nameOnCard} onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })} aria-invalid={!!paymentErrors.nameOnCard} />
                {paymentErrors.nameOnCard && <div className="text-xs text-red-600" role="alert">{paymentErrors.nameOnCard}</div>}
              </label>
              <label className="block">
                <div className="text-sm">Card number</div>
                <input inputMode="numeric" className={`w-full border rounded px-2 py-1 ${paymentErrors.cardNumber ? 'border-red-600' : ''}`} value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} aria-invalid={!!paymentErrors.cardNumber} />
                {paymentErrors.cardNumber && <div className="text-xs text-red-600" role="alert">{paymentErrors.cardNumber}</div>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-sm">Expiry (MM/YY)</div>
                  <input className={`w-full border rounded px-2 py-1 ${paymentErrors.expiry ? 'border-red-600' : ''}`} value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} aria-invalid={!!paymentErrors.expiry} />
                  {paymentErrors.expiry && <div className="text-xs text-red-600" role="alert">{paymentErrors.expiry}</div>}
                </label>
                <label className="block">
                  <div className="text-sm">CVV</div>
                  <input inputMode="numeric" className={`w-full border rounded px-2 py-1 ${paymentErrors.cvv ? 'border-red-600' : ''}`} value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} aria-invalid={!!paymentErrors.cvv} />
                  {paymentErrors.cvv && <div className="text-xs text-red-600" role="alert">{paymentErrors.cvv}</div>}
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={prevStep}>Back</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={nextStep}>Continue to review</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="review-heading">
            <h2 id="review-heading" className="font-medium">Review & place order</h2>
            <div className="mt-3">
              <h3 className="font-medium">Shipping</h3>
              <div className="text-sm text-gray-600">{shipping.fullName}<br />{shipping.street}<br />{shipping.city} {shipping.state} {shipping.zipCode}<br />{shipping.country}</div>

              <h3 className="font-medium mt-4">Payment</h3>
              <div className="text-sm text-gray-600">{payment.nameOnCard} — **** **** **** {payment.cardNumber.slice(-4)}</div>

              <h3 className="font-medium mt-4">Items</h3>
              <ul className="mt-2 space-y-2">
                {activeItems.map((it) => (
                  <li key={it.id} className="border p-2 rounded">
                    <div>{it.name} — ${it.price} × {it.quantity}</div>
                    {it.options && <div className="text-sm text-gray-600">{Object.entries(it.options).map(([k,v]) => <span key={k} className="block">{k}: {v}</span>)}</div>}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                <button className="bg-gray-200 px-3 py-1 rounded" onClick={prevStep}>Back</button>
                <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={submitting} onClick={placeOrder}>{submitting ? 'Placing…' : `Place order • $${total.toFixed(2)}`}</button>
              </div>

              {errorMessage && <div className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</div>}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
