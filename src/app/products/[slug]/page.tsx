import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNaira, getProductPrice, parseProductImages } from "@/lib/product";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductCard } from "@/components/product-card";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true, description: true } });
  return product
    ? { title: product.name, description: product.description }
    : { title: "Product not found" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: { category: true },
  });
  if (!product) notFound();

  const [images, related] = await Promise.all([
    Promise.resolve(parseProductImages(product.images)),
    prisma.product.findMany({
      where: { isPublished: true, categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
    }),
  ]);
  const image = images[0];
  const currentPrice = getProductPrice(product);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {image ? <Image src={image} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority /> : null}
        </div>
        <div>
          <p className="text-sm font-bold text-[#2168E8]">{product.category.name}</p>
          <h1 className="mt-3 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">{product.name}</h1>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-black text-[#0B1F3A]">{formatNaira(currentPrice)}</p>
            {product.salePrice && product.salePrice > 0 && (
              <p className="pb-1 text-lg text-slate-400 line-through">{formatNaira(product.price)}</p>
            )}
          </div>
          <p className={`mt-3 text-sm font-semibold ${product.stock > 0 ? "text-[#16A36A]" : "text-[#DC4545]"}`}>
            {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
          </p>
          <p className="mt-6 leading-7 text-slate-600">{product.description}</p>
          <ProductDetailActions product={{ id: product.id, name: product.name, slug: product.slug, image, price: currentPrice, stock: product.stock }} />
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-bold text-[#172337]">Delivery information</p>
            <p className="mt-2">Delivery availability and fees are calculated securely at checkout.</p>
            <p className="mt-2">SKU: {product.sku}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-[#0B1F3A]">Related products</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
