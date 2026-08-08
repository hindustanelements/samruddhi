"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";

function readStorageValue(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const AppContext = createContext();

export function Provider({ children }) {
  const [cart, setCart] = useState(() => readStorageValue("samruddhi-cart", []));
  const [user, setUser] = useState(() => readStorageValue("samruddhi-user", null));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("samruddhi-cart", JSON.stringify(cart));
    }
  }, [cart]);

  const add = (product, quantity = 1) => {
    setCart((old) => old.some((x) => x.id === product.id)
      ? old.map((x) => x.id === product.id ? { ...x, quantity: Math.min(x.quantity + quantity, product.stock) } : x)
      : [...old, { ...product, quantity }]);
    setNotice(`${product.name} added to your basket`);
    setTimeout(() => setNotice(""), 2500);
  };
  const update = (id, quantity) => setCart((old) => old.map((x) => x.id === id ? { ...x, quantity: Math.max(1, Math.min(quantity, x.stock)) } : x));
  const remove = (id) => setCart((old) => old.filter((x) => x.id !== id));
  const login = (payload) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("samruddhi-token", payload.token);
      window.localStorage.setItem("samruddhi-user", JSON.stringify(payload.user));
    }
    setUser(payload.user);
  };
  const updateUser = (nextUser) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("samruddhi-user", JSON.stringify(nextUser));
    }
    setUser(nextUser);
  };
  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("samruddhi-token");
      window.localStorage.removeItem("samruddhi-user");
    }
    setUser(null);
  };

  return <AppContext.Provider value={{ cart, add, update, remove, setCart, user, login, updateUser, logout }}>
    {children}
    {notice && <div className="fixed bottom-7 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-2xl"><span className="flex items-center gap-2"><BadgeCheck size={18}/>{notice}</span></div>}
  </AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
