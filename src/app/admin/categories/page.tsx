import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-bold text-[#2168E8]">Catalogue</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Categories</h1>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Create category</h2>
        <form action={createCategory} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Name<input required name="name" className="admin-input" /></label>
          <label className="text-sm font-medium">Slug<input required name="slug" className="admin-input" /></label>
          <label className="text-sm font-medium">Image URL<input name="image" type="url" className="admin-input" /></label>
          <label className="text-sm font-medium">Description<input name="description" className="admin-input" /></label>
          <label className="flex items-center gap-2 text-sm"><input name="isVisible" type="checkbox" defaultChecked /> Visible in store</label>
          <button className="rounded-lg bg-[#2168E8] px-4 py-3 text-sm font-bold text-white md:w-fit">Create category</button>
        </form>
      </section>
      <section className="space-y-4">
        {categories.map((category) => (
          <article key={category.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex justify-between gap-4">
              <h2 className="font-bold text-[#0B1F3A]">{category.name} <span className="font-normal text-slate-500">· {category._count.products} products</span></h2>
              <span className="text-sm text-slate-500">{category.isVisible ? "Visible" : "Hidden"}</span>
            </div>
            <form action={updateCategory} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={category.id} />
              <label className="text-sm font-medium">Name<input required name="name" defaultValue={category.name} className="admin-input" /></label>
              <label className="text-sm font-medium">Slug<input required name="slug" defaultValue={category.slug} className="admin-input" /></label>
              <label className="text-sm font-medium">Image URL<input name="image" type="url" defaultValue={category.image ?? ""} className="admin-input" /></label>
              <label className="text-sm font-medium">Description<input name="description" defaultValue={category.description ?? ""} className="admin-input" /></label>
              <label className="flex items-center gap-2 text-sm"><input name="isVisible" type="checkbox" defaultChecked={category.isVisible} /> Visible in store</label>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Save changes</button>
                {category._count.products === 0 && <button formAction={deleteCategory} formNoValidate className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Delete</button>}
              </div>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
