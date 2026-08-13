"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money, request } from "../lib/store";
import AuthPage from "./AuthPage";

function Orders() {
  const { user } = useApp();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) request("/orders/mine").then(setOrders);
  }, [user]);

  if (!user) return <AuthPage/>;

  return <main className="container-site py-12"><h1 className="text-4xl text-forest">Your orders</h1><div className="mt-8 space-y-5">{orders.length ? orders.map((o) => <div key={o.id} className="card p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-ink/45">Order {o.orderNumber}</p><h3 className="mt-1 text-xl text-forest">{o.items.reduce((s,i)=>s+i.quantity,0)} items - {money(o.total)}</h3><p className="mt-1 text-xs text-ink/45">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p></div><span className="h-fit rounded-full bg-leaf/10 px-4 py-2 text-xs font-bold text-forest">{o.status}</span></div><div className="mt-5 divide-y divide-forest/10 border-y border-forest/10">{o.items.map((i) => <div key={i.id} className="flex gap-4 py-4"><Link to={`/products/${i.product?.slug || ""}`} className="shrink-0"><img src={i.product?.image || "/samruddhi-hero.png"} alt={i.name} className="aspect-[4/3] h-20 w-20 rounded-xl border border-forest/10 bg-white object-cover"/></Link><div className="min-w-0 flex-1"><Link to={`/products/${i.product?.slug || ""}`} className="font-semibold text-forest hover:text-leaf">{i.name}</Link><p className="mt-1 text-xs text-ink/45">{i.weight}{i.product?.sku ? ` - ${i.product.sku}` : ""}</p><div className="mt-3 grid gap-2 text-sm text-ink/60 sm:grid-cols-3"><span>Qty: <strong className="text-ink">{i.quantity}</strong></span><span>Price: <strong className="text-ink">{money(i.price)}</strong></span><span>Total: <strong className="text-ink">{money(Number(i.price) * i.quantity)}</strong></span></div></div></div>)}</div><div className="mt-5 ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>{Number(o.discount)>0&&<div className="flex justify-between text-forest"><span>{o.couponCode || "Coupon"}</span><span>-{money(o.discount)}</span></div>}<div className="flex justify-between"><span>Delivery</span><span>{Number(o.delivery) ? money(o.delivery) : "Free"}</span></div><div className="flex justify-between border-t border-forest/10 pt-2 text-base font-bold"><span>Total</span><span>{money(o.total)}</span></div></div></div>) : <p className="text-ink/50">No orders yet.</p>}</div></main>;
}

export default Orders;
