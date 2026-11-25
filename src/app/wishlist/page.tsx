import { requireCustomer } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const instant = false;

export default async function WishlistPage() {
  const currentUser = await requireCustomer();

  const entries = await prisma.wishlist.findMany({
    where: { userId: currentUser.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <h1 className="text-3xl font-bold text-[#0B1F3A]">My wishlist</h1>
      {entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-bold text-[#0B1F3A]">No saved products yet</p>
          <p className="mt-2 text-sm text-slate-500">Save products while you browse to find them here.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {entries.map((entry) => <ProductCard key={entry.id} product={entry.product} />)}
        </div>
      )}
    </main>
  );
}
