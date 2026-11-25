import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const instant = false;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, isVisible: true },
  });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="rounded-2xl bg-[#0B1F3A] px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-bold text-[#3D8BFF]">Category</p>
        <h1 className="mt-2 text-4xl font-bold">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-slate-300">{category.description}</p>}
        <p className="mt-4 text-sm">{products.length} products</p>
      </div>
      {products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No products in this category yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </main>
  );
}
