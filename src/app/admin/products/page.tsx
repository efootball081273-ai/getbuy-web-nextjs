import { createProduct, updateProduct, archiveProduct } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { parseProductImages, formatNaira } from "@/lib/product";
import ProductImageInput from "@/app/admin/products/ProductImageInput";

export const instant = false;
const pageSize = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { slug: { contains: query } },
        ],
      }
    : {};
  const [products, categories, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-bold text-[#2168E8]">Catalogue</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Products</h1>
      </header>

      <details className="rounded-xl border border-slate-200 bg-white p-5" open>
        <summary className="cursor-pointer text-lg font-bold text-[#0B1F3A]">Add a product</summary>
        <form action={createProduct} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Name<input required name="name" className="admin-input" /></label>
          <label className="text-sm font-medium">Slug<input required name="slug" placeholder="lowercase-with-hyphens" className="admin-input" /></label>
          <label className="text-sm font-medium">SKU<input required name="sku" className="admin-input" /></label>
          <label className="text-sm font-medium">Category<select required name="categoryId" className="admin-input"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm font-medium">Price (NGN)<input required name="price" type="number" min="1" step="1" className="admin-input" /></label>
          <label className="text-sm font-medium">Sale price (NGN)<input name="salePrice" type="number" min="1" step="1" className="admin-input" /></label>
          <label className="text-sm font-medium">Stock<input required name="stock" type="number" min="0" step="1" className="admin-input" /></label>
          <div className="md:col-span-2"><ProductImageInput required /></div>
          <label className="text-sm font-medium md:col-span-2">Description<textarea required name="description" rows={3} className="admin-input" /></label>
          <div className="flex flex-wrap gap-5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked /> Published</label>
          </div>
          <button type="submit" className="rounded-lg bg-[#2168E8] px-5 py-3 text-sm font-bold text-white md:col-span-2 md:w-fit">Create product</button>
        </form>
      </details>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3A]">Inventory</h2>
            <p className="mt-1 text-sm text-slate-500">{total} products</p>
          </div>
          <form className="flex gap-2">
            <input name="q" defaultValue={query} placeholder="Search name, SKU or slug" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Search</button>
          </form>
        </div>
        <div className="mt-5 space-y-4">
          {products.map((product) => (
            <details key={product.id} className="rounded-lg border border-slate-200 p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-[#0B1F3A]">{product.name}</span>
                <span className="text-sm text-slate-500">{product.sku} · {product.category.name} · stock {product.stock} · {formatNaira(product.salePrice ?? product.price)}</span>
              </summary>
              <form action={updateProduct} className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={product.id} />
                <label className="text-sm font-medium">Name<input required name="name" defaultValue={product.name} className="admin-input" /></label>
                <label className="text-sm font-medium">Slug<input required name="slug" defaultValue={product.slug} className="admin-input" /></label>
                <label className="text-sm font-medium">SKU<input required name="sku" defaultValue={product.sku} className="admin-input" /></label>
                <label className="text-sm font-medium">Category<select required name="categoryId" defaultValue={product.categoryId} className="admin-input">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="text-sm font-medium">Price (NGN)<input required name="price" type="number" min="1" step="1" defaultValue={product.price / 100} className="admin-input" /></label>
                <label className="text-sm font-medium">Sale price (NGN)<input name="salePrice" type="number" min="1" step="1" defaultValue={product.salePrice ? product.salePrice / 100 : ""} className="admin-input" /></label>
                <label className="text-sm font-medium">Stock<input required name="stock" type="number" min="0" defaultValue={product.stock} className="admin-input" /></label>
                <div><ProductImageInput required initialValue={parseProductImages(product.images).join("\n")} /></div>
                <label className="text-sm font-medium md:col-span-2">Description<textarea required name="description" rows={3} defaultValue={product.description} className="admin-input" /></label>
                <div className="flex flex-wrap gap-5 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={product.isPublished} /> Published</label>
                </div>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Save changes</button>
                  {product.isPublished && <button formAction={archiveProduct} formNoValidate className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Archive</button>}
                </div>
              </form>
            </details>
          ))}
          {products.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No matching products.</p>}
        </div>
        {pageCount > 1 && <div className="mt-5 flex justify-center gap-2">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <a key={number} href={`/admin/products?q=${encodeURIComponent(query)}&page=${number}`} className={`rounded-md px-3 py-2 text-sm ${number === page ? "bg-[#2168E8] text-white" : "border"}`}>{number}</a>)}</div>}
      </section>
    </main>
  );
}
