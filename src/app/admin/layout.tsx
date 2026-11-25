import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const instant = false;

const links = [
  ["Overview", "/admin"],
  ["Products", "/admin/products"],
  ["Categories", "/admin/categories"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Settings", "/admin/settings"],
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="min-h-full bg-[#F7F9FC]">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-black text-[#0B1F3A]">GETBUY <span className="text-sm font-semibold text-slate-400">Admin</span></Link>
          <Link href="/" className="text-sm font-semibold text-[#2168E8]">View store →</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
          <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 lg:flex-col lg:self-start">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#EAF2FF] hover:text-[#2168E8]">
                {label}
              </Link>
            ))}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
