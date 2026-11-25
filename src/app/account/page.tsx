import Link from "next/link";
import { logoutCustomer } from "@/app/actions/auth";
import { requireCustomer } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/product";

export const instant = false;

export default async function AccountPage() {
  const currentUser = await requireCustomer();

  const [recentOrders, totalOrders, pendingOrders, completedOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: { userId: currentUser.id },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.count({ where: { userId: currentUser.id } }),
      prisma.order.count({
        where: { userId: currentUser.id, orderStatus: "PENDING" },
      }),
      prisma.order.count({
        where: { userId: currentUser.id, orderStatus: "DELIVERED" },
      }),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-bold text-[#2168E8]">My GETBUY</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A]">
            Welcome, {currentUser.name}
          </h1>
          <p className="mt-2 text-slate-600">Manage your account and keep track of your orders.</p>
        </div>
        <form action={logoutCustomer}>
          <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#2168E8]">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total orders", totalOrders],
          ["Pending orders", pendingOrders],
          ["Completed orders", completedOrders],
        ].map(([label, count]) => (
          <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{String(label)}</p>
            <p className="mt-2 text-3xl font-bold text-[#0B1F3A]">{count}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">Recent orders</h2>
            <Link href="/account/orders" className="text-sm font-bold text-[#2168E8]">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              <p>You have no orders yet.</p>
              <Link href="/products" className="mt-3 inline-block font-semibold text-[#2168E8]">Start shopping</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#2168E8]"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#0B1F3A]">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.createdAt.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}
                        {" · "}{order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatNaira(order.total)}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.paymentStatus} · {order.orderStatus}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-[#0B1F3A]">Account information</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="mt-1 font-medium">{currentUser.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-1 break-all font-medium">{currentUser.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="mt-1 font-medium">{currentUser.phone || "Not provided"}</dd>
            </div>
          </dl>
          <Link href="/account/orders" className="mt-5 block rounded-lg bg-[#2168E8] px-4 py-3 text-center text-sm font-bold text-white">
            Track my orders
          </Link>
        </aside>
      </div>
    </main>
  );
}
