import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";

export const instant = false;

export default async function AdminPage() {
  await requireAdmin();
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1);
  since.setHours(0, 0, 0, 0);

  const [
    revenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalCustomers,
    totalProducts,
    lowStock,
    recentOrders,
    recentCustomers,
    paidOrders,
    soldItems,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: "PENDING" } }),
    prisma.order.count({ where: { orderStatus: "DELIVERED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.product.findMany({
      where: { isPublished: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, slug: true, stock: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      where: { productId: { not: null }, order: { paymentStatus: "PAID" } },
      select: { productId: true, productName: true, quantity: true },
    }),
  ]);

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(since);
    date.setMonth(since.getMonth() + index);
    return {
      label: date.toLocaleDateString("en-NG", { month: "short", timeZone: "Africa/Lagos" }),
      year: date.getFullYear(),
      month: date.getMonth(),
      revenue: 0,
    };
  });
  for (const order of paidOrders) {
    const bucket = monthBuckets.find(
      (month) => month.year === order.createdAt.getFullYear() && month.month === order.createdAt.getMonth(),
    );
    if (bucket) bucket.revenue += order.total;
  }
  const maxRevenue = Math.max(1, ...monthBuckets.map((month) => month.revenue));

  const salesMap = new Map<string, { name: string; quantity: number }>();
  for (const item of soldItems) {
    if (!item.productId) continue;
    const existing = salesMap.get(item.productId);
    if (existing) existing.quantity += item.quantity;
    else salesMap.set(item.productId, { name: item.productName, quantity: item.quantity });
  }
  const bestSellers = [...salesMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const stats = [
    ["Verified revenue", formatNaira(revenue._sum.total ?? 0)],
    ["Total orders", totalOrders],
    ["Pending orders", pendingOrders],
    ["Completed orders", completedOrders],
    ["Customers", totalCustomers],
    ["Products", totalProducts],
  ];

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#2168E8]">Store overview</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Dashboard</h1>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{String(label)}</p>
            <p className="mt-2 text-2xl font-bold text-[#0B1F3A]">{value}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Revenue · last 6 months</h2>
          <div className="mt-6 flex h-48 items-end gap-3 border-b border-slate-200 px-2">
            {monthBuckets.map((month) => (
              <div key={`${month.year}-${month.month}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-center text-[10px] text-slate-500">{formatNaira(month.revenue)}</span>
                <div
                  className="w-full max-w-12 rounded-t-md bg-[#2168E8] transition-all"
                  style={{ height: `${Math.max(3, (month.revenue / maxRevenue) * 100)}%` }}
                  title={`${month.label}: ${formatNaira(month.revenue)}`}
                />
                <span className="text-xs text-slate-500">{month.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Best sellers</h2>
          {bestSellers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Paid order sales will appear here.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {bestSellers.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                  <span className="line-clamp-1">{index + 1}. {item.name}</span>
                  <strong className="shrink-0">{item.quantity} sold</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-[#2168E8]">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-slate-500">{order.customerName} · {order.orderStatus}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNaira(order.total)}</p>
                  <p className="text-slate-500">{order.paymentStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Low stock alerts</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-[#2168E8]">Manage products</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No products currently at low stock.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((product) => (
                <li key={product.id} className="flex justify-between gap-3 text-sm">
                  <Link href={`/products/${product.slug}`} className="line-clamp-1 font-medium hover:text-[#2168E8]">{product.name}</Link>
                  <span className="shrink-0 font-semibold text-[#DC4545]">{product.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Recent customers</h2>
          <Link href="/admin/customers" className="text-sm font-semibold text-[#2168E8]">View all</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {recentCustomers.map((customer) => (
            <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="rounded-lg border border-slate-100 p-3 hover:border-[#2168E8]">
              <p className="line-clamp-1 text-sm font-semibold">{customer.name}</p>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">{customer.email}</p>
              <p className="mt-2 text-xs text-slate-400">{customer.createdAt.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
