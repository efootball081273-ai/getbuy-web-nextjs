import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const instant = false;

type SearchParams = Promise<{
  search?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  availability?: string;
  page?: string;
}>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const perPage = 12;
  const min = params.min ? Number(params.min) * 100 : undefined;
  const max = params.max ? Number(params.max) * 100 : undefined;

  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { name: "asc" },
  });

  const category = params.category
    ? await prisma.category.findUnique({ where: { slug: params.category } })
    : null;

  const where = {
    isPublished: true,
    ...(category ? { categoryId: category.id } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }
      : {}),
    ...(min !== undefined || max !== undefined
      ? { price: { gte: min, lte: max } }
      : {}),
    ...(params.availability === "in-stock" ? { stock: { gt: 0 } } : {}),
  };

  const orderBy =
    params.sort === "price-low"
      ? { price: "asc" as const }
      : params.sort === "price-high"
        ? { price: "desc" as const }
        : params.sort === "popular"
          ? { isFeatured: "desc" as const }
          : { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));

  function withParam(name: string, value: string) {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val && key !== name) next.set(key, val);
    });
    if (value) next.set(name, value);
    return `/products?${next.toString()}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#2168E8]">Shop</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A]">All products</h1>
        </div>
        <form className="flex flex-wrap gap-2">
          <input name="search" defaultValue={params.search} placeholder="Search" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="category" defaultValue={params.category} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <input name="min" type="number" min="0" defaultValue={params.min} placeholder="Min ₦" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="max" type="number" min="0" defaultValue={params.max} placeholder="Max ₦" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="sort" defaultValue={params.sort} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
          <select name="availability" defaultValue={params.availability} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Any availability</option>
            <option value="in-stock">In stock</option>
          </select>
          <button type="submit" className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Apply</button>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-bold text-[#0B1F3A]">No products found</p>
          <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <a
              key={number}
              href={withParam("page", String(number))}
              className={`rounded-lg px-3 py-2 text-sm ${number === page ? "bg-[#2168E8] text-white" : "border border-slate-200 bg-white"}`}
            >
              {number}
            </a>
          ))}
        </nav>
      )}
    </main>
  );
}
