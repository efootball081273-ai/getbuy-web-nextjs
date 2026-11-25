import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentReference } from "@/lib/payments";

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(100),
  delivery: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(20),
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    country: z.literal("Nigeria"),
  }),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout" }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() || null;
  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return NextResponse.json({ orderId: existing.id, orderNumber: existing.orderNumber });
    }
  }

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isPublished: true,
    },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products are unavailable" }, { status: 409 });
  }

  const setting = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const deliveryFee = setting?.deliveryFee ?? 0;

  for (const product of products) {
    const quantity = quantities.get(product.id) ?? 0;
    if (quantity > product.stock) {
      return NextResponse.json({ error: "One or more products no longer have sufficient stock" }, { status: 409 });
    }
  }

  const subtotal = products.reduce((total, product) => {
    const quantity = quantities.get(product.id) ?? 0;
    const unitPrice = product.salePrice && product.salePrice > 0
      ? product.salePrice
      : product.price;
    return total + unitPrice * quantity;
  }, 0);

  const session = await auth();
  let userId: string | null = null;
  if (session?.user) {
    const activeUser = await prisma.user.findFirst({
      where: { id: session.user.id, isActive: true },
      select: { id: true },
    });
    if (!activeUser) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
    }
    userId = activeUser.id;
  }
  const reference = createPaymentReference();
  const orderNumber = `GB-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  try {
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          orderNumber,
          idempotencyKey,
          userId,
          customerName: parsed.data.delivery.fullName,
          customerEmail: parsed.data.delivery.email,
          customerPhone: parsed.data.delivery.phone,
          deliveryAddress: parsed.data.delivery.address,
          city: parsed.data.delivery.city,
          state: parsed.data.delivery.state,
          country: parsed.data.delivery.country,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          paymentStatus: "UNPAID",
          orderStatus: "PENDING",
          paymentReference: reference,
          items: {
            create: products.map((product) => {
              const quantity = quantities.get(product.id) ?? 0;
              const unitPrice = product.salePrice && product.salePrice > 0
                ? product.salePrice
                : product.price;
              return {
                productId: product.id,
                productName: product.name,
                productPrice: unitPrice,
                quantity,
                subtotal: unitPrice * quantity,
              };
            }),
          },
          payments: {
            create: {
              provider: "MONNIFY",
              reference,
              amount: subtotal + deliveryFee,
              status: "PENDING",
            },
          },
        },
      });
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      reference,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient stock") {
      return NextResponse.json({ error: "One or more products no longer have sufficient stock" }, { status: 409 });
    }
    if (
      idempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return NextResponse.json({
          orderId: existing.id,
          orderNumber: existing.orderNumber,
        });
      }
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
  }
}
