"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart";

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="mr-auto text-xl font-black tracking-tight text-[#0B1F3A] lg:mr-5">
            GETBUY
          </Link>
          <form action="/products" className="hidden max-w-xl flex-1 md:flex">
            <div className="flex w-full overflow-hidden rounded-lg border border-slate-300 focus-within:border-[#2168E8]">
              <input
                name="search"
                placeholder="Search products"
                className="min-w-0 flex-1 px-4 py-2.5 text-sm outline-none"
                aria-label="Search products"
              />
              <button type="submit" className="bg-[#2168E8] px-4 text-white" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
          <Link href={isAuthenticated ? "/account" : "/login"} className="rounded-lg p-2 text-[#172337]" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          {isAuthenticated && (
            <Link href="/wishlist" className="hidden rounded-lg p-2 sm:block" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          )}
          <Link href="/cart" className="relative rounded-lg p-2" aria-label={`Cart with ${itemCount} items`}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2168E8] px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
        <nav className={`${open ? "flex" : "hidden"} flex-col gap-1 pb-4 text-sm font-medium lg:flex lg:flex-row lg:items-center lg:gap-7 lg:pb-3`}>
          <Link href="/products" onClick={() => setOpen(false)}>All products</Link>
          <Link href="/categories/electronics" onClick={() => setOpen(false)}>Electronics</Link>
          <Link href="/categories/fashion" onClick={() => setOpen(false)}>Fashion</Link>
          <Link href="/categories/home-and-living" onClick={() => setOpen(false)}>Home & Living</Link>
        </nav>
      </div>
    </header>
  );
}
