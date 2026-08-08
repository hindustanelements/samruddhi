"use client";

import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { STORE_PHONE } from "../lib/store";

export default function Footer() {
  return (
    <footer className="bg-[#1e382a] pt-14 text-white">
      <div className="container-site grid grid-cols-2 gap-8 pb-12 lg:grid-cols-4">
        <div>
          <p className="text-sm leading-6 text-white/55">
            Natural pantry essentials and traditional kitchenware, brought from trusted hands to your home.
          </p>
          <div className="mt-5 flex gap-3">
            <Instagram size={19} />
            <Facebook size={19} />
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-bold">Shop</h3>
          <div className="mt-4 space-y-2 text-sm text-white/55">
            <Link className="block" to="/products?category=cashews">Cashews & Dry Fruits</Link>
            <Link className="block" to="/products?category=millets">Millets</Link>
            <Link className="block" to="/products?category=natural-spices">Spices & Staples</Link>
            <Link className="block" to="/products?category=mitti-cookware">Mitti Cookware</Link>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-bold">Help</h3>
          <div className="mt-4 space-y-2 text-sm text-white/55">
            <Link className="block" to="/about">Our Story</Link>
            <Link className="block" to="/contact">Contact</Link>
            <Link className="block" to="/orders">My Orders</Link>
            <span className="block">Shipping & Returns</span>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-bold">Contact</h3>
          <div className="mt-4 space-y-3 text-sm text-white/55">
            <p>+91 {STORE_PHONE}</p>
            <p>purchase@samruddhi.store</p>
            <p>Maddilapalem, Visakhapatnam</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-site flex flex-col justify-between gap-2 text-xs text-white/35 sm:flex-row">
          <span>Copyright 2026 Samruddhi. All rights reserved.</span>
          <span>
            Developed by{" "}
            <a href="https://www.techwell.co.in" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">
              Techwell
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
