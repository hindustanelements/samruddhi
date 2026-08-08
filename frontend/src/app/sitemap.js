const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap() {
  const now = new Date();
  const routes = [
    "",
    "/categories",
    "/products",
    "/about",
    "/contact",
    "/login",
    "/cart"
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/products" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.7
  }));
}
