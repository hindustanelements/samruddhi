"use client";

import { Link, useParams } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

function Success(){const {number}=useParams();return <main className="container-site py-24 text-center"><span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-leaf/10 text-leaf"><BadgeCheck size={45}/></span><h1 className="mt-7 text-4xl text-forest">Your order is in good hands.</h1><p className="mt-3 text-ink/55">Order <strong>{number}</strong> is confirmed. We’ll keep you updated as it travels from our pantry to yours.</p><Link to="/products" className="btn-primary mt-7">Continue shopping</Link></main>}

export default Success;
