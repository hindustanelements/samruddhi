"use client";

import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { GrandOpeningPopup } from "../components/GrandOpening";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/Footer";
import { Provider } from "../context/AppContext";
import { STORE_WHATSAPP } from "../lib/store";
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
  return <Provider><ScrollTop/><Navbar/><GrandOpeningPopup/><Routes>
    <Route path="/" element={<Home/>}/><Route path="/categories" element={<CategoriesPage/>}/><Route path="/products" element={<Products/>}/><Route path="/offers" element={<Offers/>}/><Route path="/products/:slug" element={<ProductDetails/>}/>
    <Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage/>}/><Route path="/profile" element={<Profile/>}/>
    <Route path="/orders" element={<Orders/>}/><Route path="/admin" element={<Admin/>}/><Route path="/about" element={<AboutPageFile/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/order-success/:number" element={<Success/>}/>
  </Routes><SiteFooter/><a href={`https://wa.me/${STORE_WHATSAPP}`} aria-label="WhatsApp Samruddhi" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-transparent shadow-xl"><img src="/whatsapp-button-transparent.png" alt="" className="h-full object-contain"/></a></Provider>;
}

function ScrollTop(){
  const {pathname}=useLocation();
  useEffect(()=>{
    window.scrollTo(0,0);
  },[pathname]);
  return null
}

export default App;
