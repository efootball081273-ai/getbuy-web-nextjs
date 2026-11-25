import Link from "next/link";
import { requireCustomer } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";

export const instant = false;

const pageSize = 10;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const currentUser = await requireCustomer();

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: currentUser.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where: { userId: currentUser.id } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/account" className="text-sm font-semibold text-[#2168E8]">← My account</Link>
          <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A]">My orders</h1>
        </div>
        <p className="text-sm text-slate-500">{total} {total === 1 ? "order" : "orders"}</p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-xl font-bold text-[#0B1F3A]">No orders yet</h2>
          <p className="mt-2 text-slate-600">Your purchases will appear here after checkout.</p>
          <Link href="/products" className="mt-5 inline-block rounded-lg bg-[#2168E8] px-5 py-3 font-bold text-white">Browse products</Link>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="font-bold text-[#2168E8] hover:underline">
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0B1F3A]">{formatNaira(order.total)}</p>
                  <p className="mt-1 text-xs text-slate-600">Payment: {order.paymentStatus}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm text-slate-600">
                    {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Delivery status: {order.orderStatus}</p>
                </div>
                <Link href={`/account/orders/${order.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-[#2168E8]">
                  View order
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Order pages">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <Link
              key={number}
              href={`/account/orders?page=${number}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${number === page ? "bg-[#2168E8] text-white" : "border border-slate-200 bg-white"}`}
            >
              {number}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}
