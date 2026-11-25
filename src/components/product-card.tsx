"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toggleWishlist } from "@/app/actions/wishlist";
import { useCartStore } from "@/store/cart";
import { formatNaira, getProductPrice, parseProductImages } from "@/lib/product";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    stock: number;
    images: string;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const [feedback, setFeedback] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const image = parseProductImages(product.images)[0];
  const currentPrice = getProductPrice(product);
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  function addToCart() {
    if (product.stock < 1) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image,
      price: currentPrice,
      stock: product.stock,
    });
    setFeedback("Added");
    window.setTimeout(() => setFeedback(""), 1200);
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        {image ? (
          <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[#DC4545] px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span>
        )}
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-12 font-semibold leading-6 text-[#172337]">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-end gap-2">
          <p className="font-bold text-[#0B1F3A]">{formatNaira(currentPrice)}</p>
          {discount > 0 && <p className="text-sm text-slate-400 line-through">{formatNaira(product.price)}</p>}
        </div>
        <p className={`mt-2 text-xs ${product.stock > 0 ? "text-[#16A36A]" : "text-[#DC4545]"}`}>
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addToCart}
            disabled={product.stock < 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2168E8] px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart className="h-4 w-4" />
            {feedback || "Add to cart"}
          </button>
          <form action={toggleWishlist.bind(null, product.id)}>
            <button type="submit" className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:border-[#2168E8] hover:text-[#2168E8]" aria-label={`Save ${product.name}`}>
              <Heart className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
