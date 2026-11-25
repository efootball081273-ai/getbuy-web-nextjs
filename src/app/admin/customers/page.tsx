import Link from "next/link";
import { setCustomerStatus } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const instant = false;
const pageSize = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = {
    role: "CUSTOMER" as const,
    ...(params.q ? {
      OR: [
        { name: { contains: params.q } },
        { email: { contains: params.q } },
        { phone: { contains: params.q } },
      ],
    } : {}),
  };
  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main>
      <header>
        <p className="text-sm font-bold text-[#2168E8]">Customers</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Customer accounts</h1>
      </header>
      <form className="mt-5 flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input name="q" defaultValue={params.q} placeholder="Search name, email or phone" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-[#2168E8] px-4 py-2 text-sm font-bold text-white">Search</button>
      </form>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[1.4fr_1.5fr_1fr_.7fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
          <span>Customer</span><span>Email / Phone</span><span>Joined</span><span>Orders</span><span>Status</span>
        </div>
        {customers.map((customer) => (
          <article key={customer.id} className="grid gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-[1.4fr_1.5fr_1fr_.7fr_1fr] md:items-center">
            <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-[#2168E8]">{customer.name}</Link>
            <div className="text-sm">
              <p>{customer.email}</p>
              <p className="text-slate-500">{customer.phone ?? "No phone"}</p>
            </div>
            <p className="text-sm text-slate-600">{customer.createdAt.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</p>
            <p className="text-sm">{customer._count.orders}</p>
            <form action={setCustomerStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={customer.id} />
              <input type="hidden" name="isActive" value={String(!customer.isActive)} />
              <span className={`text-xs font-semibold ${customer.isActive ? "text-[#16A36A]" : "text-[#DC4545]"}`}>{customer.isActive ? "Active" : "Disabled"}</span>
              <button className="text-xs font-semibold text-[#2168E8]">{customer.isActive ? "Disable" : "Enable"}</button>
            </form>
          </article>
        ))}
        {customers.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No customers found.</p>}
      </div>
      {pages > 1 && <div className="mt-5 flex justify-center gap-2">{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <Link key={number} href={`/admin/customers?q=${encodeURIComponent(params.q ?? "")}&page=${number}`} className={`rounded-md px-3 py-2 text-sm ${number === page ? "bg-[#2168E8] text-white" : "border bg-white"}`}>{number}</Link>)}</div>}
    </main>
  );
}
