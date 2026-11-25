import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";

export const instant = false;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
      },
    },
  });
  if (!customer) notFound();

  return (
    <main>
      <Link href="/admin/customers" className="text-sm font-semibold text-[#2168E8]">← Customers</Link>
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer profile</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A]">{customer.name}</h1>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-medium">{customer.email}</dd></div>
          <div><dt className="text-slate-500">Phone</dt><dd className="mt-1 font-medium">{customer.phone ?? "Not provided"}</dd></div>
          <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium">{customer.isActive ? "Active" : "Disabled"}</dd></div>
          <div><dt className="text-slate-500">Joined</dt><dd className="mt-1 font-medium">{customer.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</dd></div>
        </dl>
      </div>
      <section className="mt-6">
        <h2 className="text-xl font-bold text-[#0B1F3A]">Order history ({customer.orders.length})</h2>
        <div className="mt-4 space-y-3">
          {customer.orders.map((order) => (
            <Link key={order.id} href={`/admin/orders?q=${encodeURIComponent(order.orderNumber)}`} className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold text-[#2168E8]">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-slate-500">{order.createdAt.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })} · {order.paymentStatus} · {order.orderStatus}</p>
              </div>
              <p className="font-bold">{formatNaira(order.total)}</p>
            </Link>
          ))}
          {customer.orders.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">This customer has not placed any orders.</p>}
        </div>
      </section>
    </main>
  );
}
