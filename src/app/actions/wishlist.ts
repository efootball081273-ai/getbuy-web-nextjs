"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function toggleWishlist(productId: string) {
  const user = await requireCustomer();

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
    });
  }

  revalidatePath("/wishlist");
  revalidatePath("/products");
}
