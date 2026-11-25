"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";

type DetailProduct = {
  id: string;
  name: string;
  slug: string;
  image: string | undefined;
  price: number;
  stock: number;
};

export function ProductDetailActions({ product }: { product: DetailProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  function addToCart(buyNow = false) {
    if (product.stock < 1) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image ?? "",
      price: product.price,
      stock: product.stock,
    }, quantity);
    setFeedback("Added to cart");
    if (buyNow) {
      window.setTimeout(() => router.push("/checkout"), 150);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Quantity</label>
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="px-4 py-2">−</button>
          <output className="min-w-12 border-x border-slate-300 px-3 py-2 text-center">{quantity}</output>
          <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="px-4 py-2">+</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => addToCart(false)} disabled={product.stock < 1} className="flex items-center justify-center gap-2 rounded-lg bg-[#2168E8] px-5 py-3 font-bold text-white disabled:bg-slate-300">
          <ShoppingCart className="h-5 w-5" /> Add to Cart
        </button>
        <button type="button" onClick={() => addToCart(true)} disabled={product.stock < 1} className="rounded-lg border border-[#2168E8] px-5 py-3 font-bold text-[#2168E8] disabled:border-slate-300 disabled:text-slate-300">Buy Now</button>
      </div>
      {feedback && <p className="mt-3 text-sm font-semibold text-[#16A36A]" role="status">{feedback}</p>}
    </div>
  );
}
