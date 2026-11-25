import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  confirmPaidOrder,
} from "@/lib/payments";
import {
  isFailedPaymentStatus,
  isSuccessfulPaymentStatus,
  verifyMonnifySignature,
} from "@/lib/payment-security";

type WebhookRecord = Record<string, unknown>;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.MONNIFY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const signature =
    request.headers.get("monnify-signature") ??
    request.headers.get("x-monnify-signature");
  if (!verifyMonnifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookRecord;
  try {
    event = JSON.parse(rawBody) as WebhookRecord;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (typeof event !== "object" || event === null || Array.isArray(event)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const transactionValue = event.transaction ?? event.eventData ?? event;
  const transaction = (
    typeof transactionValue === "object" && transactionValue !== null
      ? transactionValue
      : event
  ) as WebhookRecord;
  const eventType = String(
    event.eventType ?? transaction.paymentStatus ?? transaction.status ?? "UNKNOWN",
  );
  const providerEventId = event.eventId ?? transaction.eventId;
  const eventId = String(
    providerEventId ??
      `${transaction.transactionReference ?? transaction.paymentReference ?? crypto.randomUUID()}:${eventType}`,
  );
  const reference =
    transaction.paymentReference ??
    transaction.transactionReference ??
    event.paymentReference;

  if (!reference) return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });

  const status = String(
    transaction.paymentStatus ?? transaction.status ?? event.eventType ?? "",
  );
  if (isFailedPaymentStatus(status)) {
    const orderUpdate = await prisma.order.updateMany({
      where: {
        paymentReference: String(reference),
        paymentStatus: { not: "PAID" },
      },
      data: { paymentStatus: "FAILED" },
    });
    if (orderUpdate.count > 0) {
      await prisma.payment.updateMany({
        where: { reference: String(reference) },
        data: { status: "FAILED" },
      });
    }
    await recordWebhookEvent(eventId);
    return NextResponse.json({ status: "FAILED" });
  }
  if (!isSuccessfulPaymentStatus(status)) {
    await recordWebhookEvent(eventId);
    return NextResponse.json({ status: "PENDING" });
  }

  const order = await prisma.order.findUnique({
    where: { paymentReference: String(reference) },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const amount = transaction.amountPaid ?? transaction.amount;
  const numericAmount = Number(amount);
  if (
    !Number.isFinite(numericAmount) ||
    (numericAmount !== order.total && numericAmount * 100 !== order.total)
  ) {
    return NextResponse.json({ error: "Transaction amount mismatch" }, { status: 409 });
  }
  const currency = transaction.currency ?? transaction.currencyCode;
  if (currency !== "NGN") {
    return NextResponse.json({ error: "Transaction currency mismatch" }, { status: 409 });
  }

  try {
    await confirmPaidOrder(order.id, String(reference));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment could not be confirmed" }, { status: 409 });
  }

  await recordWebhookEvent(eventId);
  return NextResponse.json({ status: "PAID" });
}

async function recordWebhookEvent(eventId: string) {
  await prisma.webhookEvent.upsert({
    where: {
      provider_eventId: {
        provider: "MONNIFY",
        eventId,
      },
    },
    create: { provider: "MONNIFY", eventId },
    update: {},
  });
}
