import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MonnifyClient } from "@/lib/monnify";

const schema = z.object({ orderId: z.string().min(1) });

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const session = await auth();
  if (order.userId) {
    if (!session?.user || session.user.id !== order.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const activeUser = await prisma.user.findFirst({
      where: { id: session.user.id, isActive: true },
      select: { id: true },
    });
    if (!activeUser) return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const monnify = new MonnifyClient();
  try {
    const result = await monnify.initialize({
      amount: order.total,
      reference: order.paymentReference ?? "",
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      redirectUrl: `${appUrl}/payments/success?reference=${encodeURIComponent(order.paymentReference ?? "")}`,
    });
    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      reference: order.paymentReference,
      transactionReference: result.transactionReference,
    });
  } catch (error) {
    await prisma.payment.updateMany({
      where: { orderId: order.id, reference: order.paymentReference ?? "" },
      data: { status: "FAILED" },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to initialize payment",
    }, { status: 502 });
  }
}
