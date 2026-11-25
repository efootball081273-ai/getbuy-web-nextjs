import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatNaira, parseProductImages } from "@/lib/product";

export const instant = false;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireCustomer();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: currentUser.id,
    },
    include: {
      items: {
        include: {
          product: {
            select: { images: true, slug: true },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/account/orders" className="text-sm font-semibold text-[#2168E8]">← Back to my orders</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Order reference</p>
          <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Placed {order.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
          </p>
        </div>
        <div className="rounded-xl bg-[#EAF2FF] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order status</p>
          <p className="mt-1 font-bold text-[#0B1F3A]">{order.orderStatus}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
          <p className="mt-1 font-bold text-[#0B1F3A]">{order.paymentStatus}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-xl font-bold text-[#0B1F3A]">Items ordered</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => {
              const image = item.product ? parseProductImages(item.product.images)[0] : "";
              return (
                <article key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  {image ? (
                    // This image is optional because the associated product may have been removed.
                    <Image src={image} alt="" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    {item.product?.slug ? (
                      <Link href={`/products/${item.product.slug}`} className="font-semibold text-[#172337] hover:text-[#2168E8]">{item.productName}</Link>
                    ) : (
                      <p className="font-semibold text-[#172337]">{item.productName}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">{formatNaira(item.productPrice)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold">{formatNaira(item.subtotal)}</p>
                </article>
              );
            })}
          </div>
          {order.statusHistory.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-[#0B1F3A]">Order updates</h2>
              <ol className="mt-4 space-y-3">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold">{entry.previousStatus} → {entry.newStatus}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {entry.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Delivery details</h2>
            <p className="mt-3 font-semibold">{order.customerName}</p>
            <p className="mt-1 text-sm text-slate-600">{order.customerEmail}</p>
            <p className="mt-1 text-sm text-slate-600">{order.customerPhone}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {order.deliveryAddress}<br />
              {order.city}, {order.state}<br />
              {order.country}
            </p>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Payment summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><strong>{formatNaira(order.subtotal)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-600">Delivery fee</span><strong>{formatNaira(order.deliveryFee)}</strong></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><span className="font-bold">Total</span><strong>{formatNaira(order.total)}</strong></div>
            </div>
            <p className="mt-4 text-xs text-slate-500">Payment reference: {order.paymentReference ?? "Not available"}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
