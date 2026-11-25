import Link from "next/link";
import { OrderStatus, Prisma } from "@prisma/client";
import { updateOrderStatus } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";

export const instant = false;
const pageSize = 15;
const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const status = statuses.includes(params.status ?? "")
    ? params.status as OrderStatus
    : undefined;
  const where: Prisma.OrderWhereInput = {
    ...(status ? { orderStatus: status } : {}),
    ...(params.q ? {
      OR: [
        { orderNumber: { contains: params.q } },
        { customerName: { contains: params.q } },
        { customerEmail: { contains: params.q } },
      ],
    } : {}),
  };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main>
      <header>
        <p className="text-sm font-bold text-[#2168E8]">Fulfilment</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Orders</h1>
      </header>
      <form className="mt-5 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input name="q" defaultValue={params.q} placeholder="Order, customer, email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Filter</button>
      </form>

      <section className="mt-5 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-bold text-[#0B1F3A]">{order.orderNumber}</p>
                <p className="mt-1 text-sm">{order.customerName} · {order.customerEmail}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {order.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} · {order.items.length} line items
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatNaira(order.total)}</p>
                <p className="mt-1 text-sm text-slate-500">Payment: {order.paymentStatus}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery status</p>
                <p className="mt-1 font-semibold">{order.orderStatus}</p>
              </div>
              <form action={updateOrderStatus} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <select name="orderStatus" defaultValue={order.orderStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Update</button>
                <Link href={`/admin/orders/${order.id}`} className="px-2 py-2 text-sm font-semibold text-[#2168E8]">Details</Link>
              </form>
            </div>
          </article>
        ))}
        {orders.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No orders match your filters.</p>}
      </section>
      {pages > 1 && <div className="mt-5 flex justify-center gap-2">{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <Link key={number} href={`/admin/orders?q=${encodeURIComponent(params.q ?? "")}&status=${status ?? ""}&page=${number}`} className={`rounded-md px-3 py-2 text-sm ${number === page ? "bg-[#2168E8] text-white" : "border bg-white"}`}>{number}</Link>)}</div>}
    </main>
  );
}
