"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/product";

export default function CartPage() {
  const { items, removeItem, setQuantity, clearCart } = useCartStore();
  const initialItems = useRef(items);

  useEffect(() => {
    if (initialItems.current.length === 0) return;
    fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: initialItems.current.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.items) return;
        clearCart();
        data.items.forEach((item: {
          productId: string;
          name: string;
          slug: string;
          price: number;
          stock: number;
          quantity: number;
          image: string;
        }) => {
          useCartStore.getState().addItem({
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            image: item.image,
            price: item.price,
            stock: item.stock,
          }, item.quantity);
        });
      })
      .catch(() => undefined);
  }, [clearCart]);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold text-[#0B1F3A]">Shopping cart</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-[#0B1F3A]">Your cart is empty</h2>
          <Link href="/products" className="mt-5 inline-block rounded-lg bg-[#2168E8] px-5 py-3 font-bold text-white">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.productId} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.image ? <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="font-bold text-[#172337]">{item.name}</Link>
                  <p className="mt-1 text-sm font-semibold text-[#2168E8]">{formatNaira(item.price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex overflow-hidden rounded-lg border border-slate-300">
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)} className="px-3 py-1">−</button>
                      <span className="min-w-9 border-x border-slate-300 px-2 py-1 text-center text-sm">{item.quantity}</span>
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1)} className="px-3 py-1">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-[#DC4545]" aria-label={`Remove ${item.name}`}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="hidden font-bold sm:block">{formatNaira(item.price * item.quantity)}</p>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">Order summary</h2>
            <div className="mt-5 flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>
            <Link href="/checkout" className="mt-6 block rounded-lg bg-[#2168E8] px-4 py-3 text-center font-bold text-white">Proceed to checkout</Link>
            <Link href="/products" className="mt-3 block text-center text-sm font-bold text-[#2168E8]">Continue shopping</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
