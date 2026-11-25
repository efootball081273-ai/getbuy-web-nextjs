import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#0B1F3A] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-black">GETBUY</p>
          <p className="mt-3 max-w-xs text-sm text-slate-300">Everything you need. Just a click away.</p>
        </div>
        <div>
          <p className="font-semibold">Shop</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <Link href="/products" className="block">All products</Link>
            <Link href="/categories/electronics" className="block">Electronics</Link>
            <Link href="/categories/fashion" className="block">Fashion</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Account</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <Link href="/account" className="block">My account</Link>
            <Link href="/account/orders" className="block">My orders</Link>
            <Link href="/wishlist" className="block">Wishlist</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Help</p>
          <p className="mt-3 text-sm text-slate-300">Customer support and delivery information.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-400">
        © 2026 GETBUY. All rights reserved.
      </div>
    </footer>
  );
}
