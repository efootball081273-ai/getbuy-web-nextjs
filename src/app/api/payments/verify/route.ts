import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MonnifyClient } from "@/lib/monnify";
import { confirmPaidOrder } from "@/lib/payments";
import {
  isFailedPaymentStatus,
  isSuccessfulPaymentStatus,
} from "@/lib/payment-security";

const schema = z.object({ reference: z.string().min(1) });

function amountMatches(value: unknown, koboAmount: number) {
  if (typeof value !== "number" && typeof value !== "string") return false;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return false;
  return amount === koboAmount || amount * 100 === koboAmount;
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { paymentReference: parsed.data.reference },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const result = await new MonnifyClient().verify(parsed.data.reference);
    const status = String(result?.paymentStatus ?? result?.transactionStatus ?? "");
    const amount = result?.amountPaid ?? result?.amount;
    const returnedReference = result?.paymentReference;
    if (
      typeof returnedReference === "string" &&
      returnedReference !== parsed.data.reference
    ) {
      return NextResponse.json({ error: "Transaction reference mismatch" }, { status: 409 });
    }
    if (!isSuccessfulPaymentStatus(status)) {
      if (isFailedPaymentStatus(status)) {
        await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "PAID" } },
          data: { paymentStatus: "FAILED" },
        });
        await prisma.payment.updateMany({
          where: {
            orderId: order.id,
            reference: parsed.data.reference,
            status: { not: "SUCCESS" },
          },
          data: { status: "FAILED" },
        });
        return NextResponse.json({ status: "FAILED" });
      }
      return NextResponse.json({ status: "PENDING" });
    }
    if (!amountMatches(amount, order.total)) {
      return NextResponse.json({ error: "Transaction amount mismatch" }, { status: 409 });
    }
    if ((result?.currency ?? result?.currencyCode) !== "NGN") {
      return NextResponse.json({ error: "Transaction currency mismatch" }, { status: 409 });
    }

    await confirmPaidOrder(order.id, parsed.data.reference);
    return NextResponse.json({ status: "PAID", orderId: order.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Payment verification failed",
    }, { status: 502 });
  }
}
