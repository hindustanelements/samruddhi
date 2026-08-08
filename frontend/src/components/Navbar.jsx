"use client";

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut, Menu, Search, ShoppingBag, X } from "lucide-react";
import { OpeningCountdown } from "./GrandOpening";
import Logo from "./Logo";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { cart, user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const submit = (e) => { e.preventDefault(); navigate(`/products?search=${encodeURIComponent(search)}`); setOpen(false); };
  const isAdminUser = ["ADMIN", "STAFF"].includes(user?.role);
  const links = [["Home", "/"], ["Categories", "/categories"], ["Products", "/products"], ["Offers", "/offers"], ["About", "/about"]];
  const profileHref = isAdminUser ? "/admin" : "/profile";
  const profileLabel = isAdminUser ? "Admin Panel" : "Profile";
  return <>
    <header className="sticky top-0 z-50 border-b" style={{ background: "var(--color-nav-bg)", borderColor: "color-mix(in srgb, var(--color-nav-text) 14%, transparent)", color: "var(--color-nav-text)" }}>
      <div className="container-site flex h-[70px] items-center justify-between gap-2 sm:gap-6 lg:gap-10">
        <Logo compact/>
        <nav className="hidden items-center gap-6 lg:flex">{links.map(([label, href]) => <NavLink key={label} to={href} className="text-xs font-semibold transition" style={({ isActive }) => ({ color: isActive ? "var(--color-nav-hover)" : "var(--color-nav-text)" })}>{label}</NavLink>)}</nav>
        <div className="flex items-center gap-2">
          <form onSubmit={submit} className="relative hidden xl:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/55" size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="w-44 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-white/55 ring-1 ring-white/15 transition focus:w-52" style={{ background: "var(--color-nav-surface)" }} placeholder="Search pantry..."/></form>
          {user ? <><Link to={profileHref} title={profileLabel} className="grid h-9 w-9 place-items-center rounded-full transition hover:text-[var(--color-nav-hover)]"><CircleUserRound size={19}/></Link><button onClick={logout} title="Sign out" className="grid h-9 w-9 place-items-center rounded-full transition hover:text-[var(--color-nav-hover)]"><LogOut size={18}/></button></> : <Link to="/login" title="Sign in" className="grid h-9 w-9 place-items-center rounded-full transition hover:text-[var(--color-nav-hover)]"><CircleUserRound size={19}/></Link>}
          <Link to="/cart" className="relative grid h-9 w-9 place-items-center rounded-full text-white ring-1 ring-white/15" style={{ background: "var(--color-nav-surface)" }}><ShoppingBag size={18}/>{cart.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">{cart.reduce((s,x)=>s+x.quantity,0)}</span>}</Link>
          <button onClick={()=>setOpen(!open)} className="grid h-9 w-9 place-items-center lg:hidden">{open ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
      </div>
      <OpeningCountdown/>
      {open && <div className="border-t px-5 py-5 lg:hidden" style={{ background: "var(--color-nav-bg)", borderColor: "color-mix(in srgb, var(--color-nav-text) 14%, transparent)" }}><form onSubmit={submit} className="mb-4"><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field" placeholder="Search products"/></form>{links.map(([label, href]) => <Link onClick={()=>setOpen(false)} key={label} to={href} className="block border-b border-white/15 py-3 font-semibold">{label}</Link>)}{user&&<><Link onClick={()=>setOpen(false)} to={profileHref} className="block border-b border-white/15 py-3 font-semibold">{profileLabel}</Link><button onClick={()=>{logout();setOpen(false)}} className="block w-full border-b border-white/15 py-3 text-left font-semibold">Logout</button></>}</div>}
    </header>
  </>;
}
