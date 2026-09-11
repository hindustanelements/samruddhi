"use client";

export const API = "/api";
export const STORE_PHONE = "9885311170";
export const STORE_WHATSAPP = `91${STORE_PHONE}`;

const fallbackCategoryImages = {
  Cashews: "/products/cashews-w320.png",
  "Dry Fruits": "/slide-dry-fruits.png",
  Millets: "/products/foxtail-millet.png",
  "Organic Staples": "/slide-organic-products.png",
  "Cold Pressed Oils": "/slide-cold-pressed-oils.png",
  "Natural Spices": "/products/turmeric.png",
  "Mitti Cookware": "/slide-mitti-products.png"
};

export const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

export async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("samruddhi-token") : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${path} (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const loadProducts = (path = "/products") => request(path);
export const loadCategories = () => request("/categories");
export const loadProduct = (slug) => request(`/products/${slug}`);
export const loadHeroSlides = () => request("/hero-slides");
export const loadHomeSettings = () => request("/home-settings");
export const categoryImage = (category) => category.image || fallbackCategoryImages[category.name] || "/samruddhi-hero.png";

export const enableAdminPush = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const registration = await navigator.serviceWorker.register("/push-sw.js");
  const { publicKey } = await request("/push/public-key");
  const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const applicationServerKey = Uint8Array.from(atob(paddedBase64), (char) => char.charCodeAt(0));
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  await request("/push/subscribe", { method: "POST", body: JSON.stringify({ subscription }) });
  return true;
};
