import Link from "next/link";
import { updateOrderStatus } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";
import { notFound } from "next/navigation";

export const instant = false;

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) notFound();

  return (
    <main>
      <Link href="/admin/orders" className="text-sm font-semibold text-[#2168E8]">← Orders</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Order reference</p>
          <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">{order.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</p>
        </div>
        <form action={updateOrderStatus} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <input type="hidden" name="orderId" value={order.id} />
          <select name="orderStatus" defaultValue={order.orderStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Update</button>
        </form>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Items</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatNaira(item.productPrice)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold">{formatNaira(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Status audit trail</h2>
            {order.statusHistory.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No fulfilment changes recorded.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-[#2168E8] pl-3">
                    <p className="text-sm font-semibold">{entry.previousStatus} → {entry.newStatus}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.user?.name ?? "System"} · {entry.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Customer & delivery</h2>
            <p className="mt-3 font-semibold">{order.customerName}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{order.customerEmail}</p>
            <p className="mt-1 text-sm text-slate-600">{order.customerPhone}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{order.deliveryAddress}<br />{order.city}, {order.state}<br />{order.country}</p>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Payment</h2>
            <p className="mt-3 text-sm">Status: <strong>{order.paymentStatus}</strong></p>
            <p className="mt-1 break-all text-xs text-slate-500">Reference: {order.paymentReference ?? "Not available"}</p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatNaira(order.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Delivery</span><strong>{formatNaira(order.deliveryFee)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Total</span><strong>{formatNaira(order.total)}</strong></div>
            </div>
            {order.payments.map((payment) => (
              <p key={payment.id} className="mt-3 text-xs text-slate-500">
                {payment.provider} · {payment.status} · {payment.reference}
              </p>
            ))}
          </section>
        </aside>
      </div>
    </main>
  );
}
