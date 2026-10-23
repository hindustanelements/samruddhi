import ClientStorefront from "../../components/ClientStorefront";

const apiTarget = process.env.INTERNAL_API_URL || process.env.API_PROXY_TARGET || "http://127.0.0.1:5000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://samruddhi.store";

async function getProduct(productSlug) {
  try {
    const res = await fetch(`${apiTarget}/api/products/${encodeURIComponent(productSlug)}`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch (error) {
    console.error("Failed to fetch product for storefront page:", productSlug, error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];

  if (slug.length === 2 && slug[0] === "products") {
    const product = await getProduct(slug[1]);
    if (product) {
      const description = product.description || product.shortDescription || "Buy natural pantry essentials at Samruddhi.";
      return {
        title: `${product.name} | Samruddhi`,
        description: description.substring(0, 160),
        alternates: { canonical: `${siteUrl}/products/${product.slug}` },
        openGraph: {
          title: product.name,
          description,
          url: `${siteUrl}/products/${product.slug}`,
          images: product.image ? [{ url: product.image.startsWith("http") ? product.image : new URL(product.image, siteUrl).toString() }] : []
        }
      };
    }
  } else if (slug.length === 1 && slug[0] === "products") {
    return {
      title: "All Products | Samruddhi",
      description: "Browse all our natural pantry essentials and kitchenware.",
      alternates: { canonical: `${siteUrl}/products` }
    };
  } else if (slug.length === 1 && slug[0] === "categories") {
    return {
      title: "Categories | Samruddhi",
      description: "Browse products by category.",
      alternates: { canonical: `${siteUrl}/categories` }
    };
  }

  return {
    title: "Samruddhi - From farm to Kitchen",
    description: "Natural pantry essentials and traditional kitchenware."
  };
}

export default async function StorefrontPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];
  const product = slug.length === 2 && slug[0] === "products" ? await getProduct(slug[1]) : null;

  const productUrl = product ? `${siteUrl}/products/${product.slug}` : null;
  const productImage = product?.image && !product.image.startsWith("data:")
    ? product.image.startsWith("http") ? product.image : new URL(product.image, siteUrl).toString()
    : undefined;
  const productDescription = product?.description || product?.shortDescription;
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription,
    sku: product.sku,
    image: productImage,
    url: productUrl,
    brand: { "@type": "Brand", name: "Samruddhi" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: Number(product.discountPrice || product.price),
      availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  } : null;

  return (
    <ClientStorefront>
      {product && (
        <>
          <main className="container-site py-12">
            <nav aria-label="Breadcrumb" className="mb-7 text-xs text-ink/45">
              <a href="/">Home</a> / <a href="/products">Products</a> / {product.name}
            </nav>
            <article className="grid gap-10 lg:grid-cols-2">
              {productImage && <img src={productImage} alt={product.name} className="block aspect-[4/3] h-full w-full rounded-[2rem] border border-forest/10 bg-white object-contain" />}
              <div>
                <p className="eyebrow">{product.category?.name}</p>
                <h1 className="mt-2 text-4xl text-forest md:text-5xl">{product.name}</h1>
                <p className="mt-4 text-3xl font-bold text-forest">
                  ₹{Number(product.discountPrice || product.price).toLocaleString("en-IN")}
                </p>
                {product.weight && <p className="mt-1">{product.weight}</p>}
                {productDescription && <p className="mt-7 leading-7 text-ink/65">{productDescription}</p>}
              </div>
            </article>
          </main>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }}
          />
        </>
      )}
    </ClientStorefront>
  );
}
