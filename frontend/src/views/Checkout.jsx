"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { money, request } from "../lib/store";

function Checkout() {
  const { cart, setCart, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    pincode: user?.pincode || ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const subtotal = cart.reduce((s, x) => s + (x.discountPrice || x.price) * x.quantity, 0);
  const delivery = 0;
  const discount = coupon?.discount || 0;

  const orderItems = () => cart.map((x) => ({ productId: x.id, quantity: x.quantity }));
  const orderBody = (paymentMethod, razorpay) => ({
    customer: form,
    paymentMethod,
    couponCode: coupon?.code || "",
    items: orderItems(),
    ...(razorpay ? { razorpay } : {})
  });
  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Could not load Razorpay. Please try COD or retry online payment."));
    document.body.appendChild(script);
  });
  const submit = (e) => {
    e.preventDefault();
    setError("");
    setPaymentStep(true);
  };
  const placeCodOrder = async () => {
    setBusy(true);
    setError("");
    try {
      const order = await request("/orders", {
        method: "POST",
        body: JSON.stringify(orderBody("COD"))
      });
      setCart([]);
      navigate(`/order-success/${order.orderNumber}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const startOnlinePayment = async () => {
    setBusy(true);
    setError("");
    try {
      await loadRazorpay();
      const payment = await request("/payments/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ customer: form, couponCode: coupon?.code || "", items: orderItems() })
      });
      const checkout = new window.Razorpay({
        key: payment.key,
        amount: payment.order.amount,
        currency: payment.order.currency,
        name: "Samruddhi Store",
        description: "Order payment",
        order_id: payment.order.id,
        prefill: {
          name: form.customerName,
          email: form.email,
          contact: form.mobile
        },
        notes: {
          address: `${form.address}, ${form.city} - ${form.pincode}`
        },
        theme: { color: "#24533f" },
        handler: async (response) => {
          try {
            const order = await request("/orders", {
              method: "POST",
              body: JSON.stringify(orderBody("ONLINE", response))
            });
            setCart([]);
            navigate(`/order-success/${order.orderNumber}`);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          }
        }
      });
      checkout.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  const applyCoupon = async () => {
    setCouponBusy(true);
    setCouponMessage("");
    setCoupon(null);
    try {
      const result = await request("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({
          code: couponCode,
          items: cart.map((x) => ({ productId: x.id, quantity: x.quantity }))
        })
      });
      setCoupon({ ...result.coupon, discount: result.discount });
      setCouponMessage(`${result.coupon.code} applied. You saved ${money(result.discount)}.`);
    } catch (e) {
      setCouponMessage(e.message);
    } finally {
      setCouponBusy(false);
    }
  };

  if (!cart.length) {
    return <div className="container-site py-24 text-center"><h1 className="text-4xl text-forest">Your basket is empty.</h1><Link to="/products" className="btn-primary mt-6">Shop now</Link></div>;
  }

  return <main className="container-site py-12"><div className="grid gap-10 lg:grid-cols-[1fr_390px]">
    <form onSubmit={submit}><p className="eyebrow">Almost home</p>
    <h1 className="mt-2 text-4xl text-forest">Customer details</h1>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{[["customerName","Full name"],["mobile","Mobile number"],["email","Email address"],["city","City"],["pincode","Pincode"]].map(([n,p])=><label key={n}>
    <span className="mb-2 block text-sm font-semibold text-forest">{p}</span><input required name={n} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} className="field"/></label>) }
    <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-forest">Complete delivery address</span><textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="field min-h-28"/></label></div>
    <div className="mt-9 rounded-2xl border border-forest/10 bg-white p-4"><label className="text-sm font-semibold text-forest">Coupon code</label><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} className="field" placeholder="Enter coupon code"/><button type="button" onClick={applyCoupon} disabled={couponBusy || !couponCode.trim()} className="btn-light shrink-0">{couponBusy?"Checking...":"Apply"}</button></div>{couponMessage&&<p className={`mt-3 text-sm ${coupon?"text-forest":"text-red-600"}`}>{couponMessage}</p>}</div>
    {error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="btn-primary mt-8 w-full sm:w-auto">{paymentStep?"Update details":"Proceed to payment"} <ArrowRight size={17}/></button>
    {paymentStep&&<div className="mt-6 grid gap-3 rounded-2xl border border-forest/10 bg-white p-4 sm:grid-cols-2"><button type="button" disabled={busy} onClick={startOnlinePayment} className="btn-primary w-full justify-center">{busy?"Starting...":"Pay online"}</button><button type="button" disabled={busy} onClick={placeCodOrder} className="btn-light w-full justify-center">{busy?"Placing...":"Cash on delivery"}</button></div>}</form>
    <aside className="card h-fit p-6"><h2 className="text-2xl text-forest">Your order</h2><div className="mt-5 max-h-72 space-y-4 overflow-auto">{cart.map(x=><div key={x.id} className="flex gap-3"><img src={x.image} className="aspect-[4/3] h-14 w-14 rounded-xl border border-forest/10 bg-white object-cover" alt={x.name}/><div className="flex-1"><p className="text-sm font-semibold">{x.name}</p><p className="text-xs text-ink/45">{x.weight} - Qty {x.quantity}</p></div><span className="text-sm font-bold">{money((x.discountPrice||x.price)*x.quantity)}</span></div>)}</div><div className="mt-5 space-y-2 border-t pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discount>0&&<div className="flex justify-between text-forest"><span>Coupon discount</span><span>-{money(discount)}</span></div>}<div className="flex justify-between"><span>Delivery</span><span>Free</span></div><div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{money(subtotal+delivery-discount)}</span></div></div></aside></div></main>;
}

export default Checkout;
