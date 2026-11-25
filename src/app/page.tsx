import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const instant = false;

export default async function Home() {
  const [categories, featured, newArrivals, offers] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      include: { _count: { select: { products: true } } },
      take: 3,
    }),
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isPublished: true, salePrice: { not: null } },
      take: 4,
    }),
  ]);

  const sections = [
    { title: "Trending now", products: featured },
    { title: "New arrivals", products: newArrivals },
    { title: "Special offers", products: offers },
  ];

  return (
    <main>
      <section className="overflow-hidden bg-[#0B1F3A] text-white">
        <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3D8BFF]">Better shopping starts here</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
              Everything You Need. Just a Click Away.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Discover amazing products and get your favourites delivered right to your doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-lg bg-[#2168E8] px-6 py-3.5 font-bold text-white">Start Shopping</Link>
              <Link href="/products" className="rounded-lg border border-white/30 px-6 py-3.5 font-bold">Explore Categories</Link>
            </div>
          </div>
          <div className="relative hidden h-[400px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#142D4C] lg:block">
            <div className="absolute -right-10 -top-12 h-72 w-72 rounded-full bg-[#2168E8]/25" />
            <div className="absolute inset-16 rounded-3xl bg-white/10 p-8 backdrop-blur">
              <p className="text-sm text-slate-300">Featured collection</p>
              <p className="mt-3 text-3xl font-bold">Tech & lifestyle</p>
              <p className="mt-3 text-slate-300">Curated essentials for work, home and everyday life.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-[#2168E8]">Explore</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0B1F3A]">Featured categories</h2>
          </div>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-[#2168E8] sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xl font-bold text-[#0B1F3A]">{category.name}</p>
              <p className="mt-2 text-sm text-slate-500">{category._count.products} products</p>
            </Link>
          ))}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="mx-auto max-w-7xl px-5 pb-14">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold text-[#0B1F3A]">{section.title}</h2>
            <Link href="/products" className="text-sm font-bold text-[#2168E8]">See all</Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {section.products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-5 pb-14">
        <div className="grid gap-4 rounded-2xl bg-[#EAF2FF] p-6 sm:grid-cols-3">
          {[
            { Icon: Truck, title: "Convenient delivery", text: "Reliable delivery across Nigeria" },
            { Icon: ShieldCheck, title: "Secure payments", text: "Protected server-side checkout" },
            { Icon: RotateCcw, title: "Easy order support", text: "Clear order and fulfilment tracking" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-3 text-[#2168E8]"><item.Icon className="h-5 w-5" /></div>
              <div>
                <p className="font-bold text-[#0B1F3A]">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
