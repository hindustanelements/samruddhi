export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiTarget = process.env.INTERNAL_API_URL || process.env.API_PROXY_TARGET || "http://127.0.0.1:5000";

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    "",
    "/categories",
    "/products",
    "/about",
    "/contact",
    "/login",
    "/cart"
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/products" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.7
  }));

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${apiTarget}/api/products`, { cache: "no-store" }),
      fetch(`${apiTarget}/api/categories`, { cache: "no-store" })
    ]);

    let productRoutes = [];
    if (productsRes.ok) {
      const products = await productsRes.json();
      productRoutes = products.map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.8
      }));
    }

    let categoryRoutes = [];
    if (categoriesRes.ok) {
      const categories = await categoriesRes.json();
      categoryRoutes = categories.map((cat) => ({
        url: `${siteUrl}/products?category=${cat.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7
      }));
    }

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch (error) {
    console.error("Failed to fetch dynamic sitemap routes:", error);
    return staticRoutes;
  }
}

