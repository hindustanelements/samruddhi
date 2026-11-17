// "use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { money, request } from "../lib/store";

function Cart() {
  const { cart, update, remove, user } = useApp();

  // ---- Delivery quote state ----
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingQuoteStatus, setShippingQuoteStatus] = useState("idle"); // idle | loading | ready | error
  const [shippingQuoteError, setShippingQuoteError] = useState("");
  const quoteRequestId = useRef(0);
  const quoteTimerId = useRef(null);

  const orderItems = () => cart.map((x) => ({ productId: x.id, quantity: x.quantity }));
  const itemsKey = orderItems().map((i) => `${i.productId}:${i.quantity}`).sort().join("|");

  // ---- Fetch shipping quote when a valid 6‑digit PIN is entered ----
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode.trim())) {
      // Invalidate any pending quote
      quoteRequestId.current += 1;
      setShippingQuote(null);
      setShippingQuoteStatus("idle");
      setShippingQuoteError("");
      return;
    }

    // Debounce request similar to Checkout page
    if (quoteTimerId.current) clearTimeout(quoteTimerId.current);
    setShippingQuoteStatus("loading");
    setShippingQuoteError("");
    const requestId = ++quoteRequestId.current;
    const currentItemsKey = itemsKey;
    quoteTimerId.current = setTimeout(async () => {
      try {
        const result = await request("/shipping/quote", {
          method: "POST",
          body: JSON.stringify({ pincode: pincode.trim(), paymentMethod: "COD", items: orderItems() })
        });
        const quote = { ...result, pincode, itemsKey: currentItemsKey };
        if (requestId === quoteRequestId.current) {
          setShippingQuote(quote);
          setShippingQuoteStatus("ready");
        }
      } catch (e) {
        if (requestId === quoteRequestId.current) {
          setShippingQuote(null);
          setShippingQuoteStatus("error");
          setShippingQuoteError(e.message);
        }
      }
    }, 400);
    return () => {
      if (quoteTimerId.current) clearTimeout(quoteTimerId.current);
      quoteTimerId.current = null;
      quoteRequestId.current += 1;
    };
  }, [pincode, itemsKey]);

  const subtotal = cart.reduce((s, x) => s + (x.discountPrice || x.price) * x.quantity, 0);

  const currentQuote =
    shippingQuote?.pincode === pincode.trim() && shippingQuote.itemsKey === itemsKey ? shippingQuote : null;

  const displayDelivery =
    shippingQuoteStatus === "loading"
      ? "Calculating..."
      : currentQuote
      ? money(currentQuote.delivery)
      : shippingQuoteError
      ? "Unavailable"
      : "Enter PIN code";

  const displayTotal =
    shippingQuoteStatus === "loading"
      ? "Calculating..."
      : currentQuote
      ? money(subtotal + currentQuote.delivery)
      : "Enter PIN code";

  if (!cart.length) {
    return (
      <main className="container-site py-24 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-oat text-clay">
          <ShoppingBag size={32} />
        </span>
        <h1 className="mt-6 text-4xl text-forest">Your basket is waiting.</h1>
        <p className="mt-3 text-ink/55">Add something wholesome from our pantry.</p>
        <Link to="/products" className="btn-primary mt-7">
          Explore products
        </Link>
      </main>
    );
  }

  return (
    <main className="container-site py-12">
      <h1 className="text-4xl text-forest">Your basket</h1>
      <p className="mt-2 text-sm text-ink/50">
        {cart.reduce((s, x) => s + x.quantity, 0)} items, packed with care
      </p>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="card flex gap-4 p-4 sm:gap-6">
              <img
                src={item.image}
                className="aspect-[4/3] h-28 w-28 rounded-2xl border border-forest/10 bg-white object-cover"
                alt={item.name}
              />
              <div className="flex flex-1 flex-col justify-between py-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-clay">{item.category?.name}</p>
                    <h3 className="mt-1 text-xl text-forest">{item.name}</h3>
                    <p className="text-xs text-ink/45">{item.weight}</p>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-ink/35 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-3 rounded-full border px-3 py-1.5">
                    <button onClick={() => update(item.id, item.quantity - 1)}>
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => update(item.id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong>{money((item.discountPrice || item.price) * item.quantity)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="card h-fit p-7">
          <h2 className="text-2xl text-forest">Order summary</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            
            {currentQuote?.courierName && (
              <p className="text-right text-xs text-ink/45">Courier: {currentQuote.courierName}</p>
            )}
            <div className="flex justify-between border-t border-forest/10 pt-4 text-lg font-bold">
              
            </div>
            {shippingQuoteError && <p className="mt-3 text-sm text-red-600">{shippingQuoteError}</p>}
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            proceed to checkout
            <ArrowRight size={17} />
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink/45">
            <ShieldCheck size={14} /> Cash on delivery, carefully handled
          </p>
        </aside>
      </div>
    </main>
  );
}

export default Cart;
