import crypto from "crypto";

export function isSuccessfulPaymentStatus(status?: string) {
  if (!status) return false;
  return [
    "PAID",
    "SUCCESS",
    "SUCCESSFUL",
    "PAID_COMPLETED",
    "PAYMENT_SUCCESSFUL",
    "SUCCESSFUL_TRANSACTION",
  ].includes(status.toUpperCase());
}

export function isFailedPaymentStatus(status?: string) {
  if (!status) return false;
  return [
    "FAILED",
    "FAIL",
    "DECLINED",
    "CANCELLED",
    "CANCELED",
    "EXPIRED",
    "FAILED_TRANSACTION",
    "CANCELLED_TRANSACTION",
  ].includes(status.toUpperCase());
}

export function verifyMonnifySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  if (!signature) return false;

  const normalized = signature.trim().toLowerCase();
  if (!/^[0-9a-f]{128}$/.test(normalized)) return false;

  const candidates = [
    crypto.createHash("sha512").update(`${secret}${rawBody}`).digest("hex"),
    crypto.createHmac("sha512", secret).update(rawBody).digest("hex"),
  ];
  const received = Buffer.from(normalized, "hex");
  return candidates.some((candidate) =>
    crypto.timingSafeEqual(Buffer.from(candidate, "hex"), received),
  );
}
