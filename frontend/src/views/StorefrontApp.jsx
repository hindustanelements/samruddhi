"use client";

import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { GrandOpeningPopup } from "../components/GrandOpening";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/Footer";
import { Provider } from "../context/AppContext";
import { request, STORE_WHATSAPP } from "../lib/store";
import { useApp } from "../context/AppContext";
import AboutPageFile from "./About";
import Admin from "./Admin";
import AuthPage from "./AuthPage";
import Cart from "./Cart";
import CategoriesPage from "./Categories";
import Checkout from "./Checkout";
import ContactPage from "./Contact";
import Home from "./Home";
import Orders from "./Orders";
import Offers from "./Offers";
import ProductDetails from "./ProductDetails";
import Products from "./Products";
import Profile from "./Profile";
import Success from "./Success";

function App() {
  return <Provider><ScrollTop/><StoreStatusControl/><Navbar/><GrandOpeningPopup/><Routes>
    <Route path="/" element={<Home/>}/><Route path="/categories" element={<CategoriesPage/>}/><Route path="/products" element={<Products/>}/><Route path="/offers" element={<Offers/>}/><Route path="/products/:slug" element={<ProductDetails/>}/>
    <Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage/>}/><Route path="/profile" element={<Profile/>}/>
    <Route path="/orders" element={<Orders/>}/><Route path="/admin" element={<Admin/>}/><Route path="/about" element={<AboutPageFile/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/order-success/:number" element={<Success/>}/>
  </Routes><SiteFooter/><a href={`https://wa.me/${STORE_WHATSAPP}`} aria-label="WhatsApp Samruddhi" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-transparent shadow-xl"><img src="/whatsapp-button-transparent.png" alt="" className="h-full object-contain"/></a></Provider>;
}

function StoreStatusControl() {
  const { user } = useApp();
  const { pathname } = useLocation();
  const [storeOpen, setStoreOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user?.role !== "ADMIN" || !pathname.startsWith("/admin")) return;
    request("/admin/home-settings").then((settings) => setStoreOpen(settings.storeOpen !== false)).catch(() => {});
  }, [user, pathname]);
  if (user?.role !== "ADMIN" || !pathname.startsWith("/admin")) return null;
  const toggle = async () => {
    setBusy(true);
    try {
      const settings = await request("/admin/home-settings");
      const updated = await request("/admin/home-settings", {
        method: "PUT",
        body: JSON.stringify({ ...settings, storeOpen: !storeOpen })
      });
      setStoreOpen(updated.storeOpen !== false);
    } finally {
      setBusy(false);
    }
  };
  return <button type="button" onClick={toggle} disabled={busy} className={`fixed right-5 top-5 z-[80] rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg ${storeOpen ? "bg-leaf" : "bg-clay"}`}>
    {busy ? "Saving..." : storeOpen ? "Store Open" : "Store Closed - Open"}
  </button>;
}

function ScrollTop(){
  const {pathname}=useLocation();
  useEffect(()=>{
    window.scrollTo(0,0);
  },[pathname]);
  return null
}

export default App;
