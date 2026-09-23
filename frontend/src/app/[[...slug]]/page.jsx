import ClientStorefront from "../../components/ClientStorefront";

const apiTarget = process.env.INTERNAL_API_URL || process.env.API_PROXY_TARGET || "http://127.0.0.1:5000";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];

  try {
    if (slug.length === 2 && slug[0] === "products") {
      const productSlug = slug[1];
      const res = await fetch(`${apiTarget}/api/products/${productSlug}`, { cache: "no-store" });
      if (res.ok) {
        const product = await res.json();
        return {
          title: `${product.name} | Samruddhi`,
          description: product.description ? product.description.substring(0, 160) : "Buy natural pantry essentials at Samruddhi.",
          openGraph: {
            title: product.name,
            description: product.description,
            images: product.image ? [{ url: product.image }] : []
          }
        };
      }
    } else if (slug.length === 1 && slug[0] === "products") {
      return {
        title: "All Products | Samruddhi",
        description: "Browse all our natural pantry essentials and kitchenware."
      };
    } else if (slug.length === 1 && slug[0] === "categories") {
      return {
        title: "Categories | Samruddhi",
        description: "Browse products by category."
      };
    }
  } catch (error) {
    console.error("Failed to generate metadata for slug:", slug, error);
  }

  return {
    title: "Samruddhi - From farm to Kitchen",
    description: "Natural pantry essentials and traditional kitchenware."
  };
}

export default function StorefrontPage() {
  return <ClientStorefront />;
}
