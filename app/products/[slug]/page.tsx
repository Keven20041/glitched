import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../lib/catalog";
import ProductAddToCartButton from "../../components/product-add-to-cart-button";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="checkout-page">
      <section className="checkout-shell" aria-label="Product details">
        <header className="checkout-header">
          <p>{product.category.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
        </header>

        {product.image && (
          <div className="product-detail-image" aria-hidden="true">
            <Image src={product.image} alt="" width={900} height={560} priority />
          </div>
        )}

        <section className="checkout-summary" aria-label="Product highlights">
          <h2>Specs</h2>
          <ul className="pulse-stats">
            {product.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
          <div className="checkout-row">
            <span>Price</span>
            <strong>{product.price}</strong>
          </div>
          <ProductAddToCartButton id={product.slug} name={product.name} price={product.price} />
          <Link href="/cart" className="checkout-link">
            Go To Cart
          </Link>
          <Link href="/" className="checkout-link">
            Back To Store
          </Link>
        </section>
      </section>
    </main>
  );
}
