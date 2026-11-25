import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function createPaymentReference(prefix = "GB") {
  return `${prefix}-${crypto.randomBytes(10).toString("hex").toUpperCase()}`;
}

export async function confirmPaidOrder(orderId: string, reference: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "PAID") return order;

    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: { not: "PAID" },
      },
      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paymentReference: reference,
      },
    });
    if (claimed.count !== 1) {
      return tx.order.findUnique({ where: { id: order.id } });
    }

    for (const item of order.items) {
      if (!item.productId) continue;
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });
      if (updated.count !== 1) throw new Error("Insufficient stock");
    }

    await tx.payment.updateMany({
      where: { orderId: order.id, reference },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.orderStatus,
        newStatus: "CONFIRMED",
      },
    });

    return tx.order.findUnique({ where: { id: order.id } });
  });
}
