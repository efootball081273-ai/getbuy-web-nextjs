import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseProductImages } from "@/lib/product";

const syncSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).max(100),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = syncSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: parsed.data.items.map((item) => item.productId) },
      isPublished: true,
    },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = parsed.data.items.flatMap((item) => {
    const product = productMap.get(item.productId);
    if (!product) return [];
    return [{
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
      stock: product.stock,
      quantity: Math.min(item.quantity, product.stock),
      image: parseProductImages(product.images)[0] ?? "",
    }];
  }).filter((item) => item.quantity > 0);

  return NextResponse.json({ items });
}
