import React from 'react';
import { money } from '../lib/store';

const ShippingSummary = ({ subtotal, shippingDelivery, discount = 0, total, loading, error, courierName }) => {
  return (
    <div className="card glassmorphism p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-forest">Order Summary</h2>
      <div className="flex justify-between mb-2">
        <span className="text-ink/70">Products</span>
        <span className="font-medium text-ink">{money(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-forest mb-2">
          <span>Coupon discount</span>
          <span>-{money(discount)}</span>
        </div>
      )}
      <div className="flex justify-between mb-2 items-center">
        <span className="text-ink/70">Shiprocket delivery</span>
        <span className="font-medium text-ink">
          {error ? 'Unavailable' : shippingDelivery != null ? money(Math.ceil(shippingDelivery)) : '—'}
        </span>
      </div>
      {courierName && (
        <p className="text-right text-xs text-ink/45 mt-1">Courier: {courierName}</p>
      )}
      <hr className="my-3" />
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{loading ? 'Calculating…' : total != null ? money(total) : '—'}</span>
      </div>
    </div>
  );
};

export default ShippingSummary;
