import { createHash, createHmac } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  isFailedPaymentStatus,
  isSuccessfulPaymentStatus,
  verifyMonnifySignature,
} from "../src/lib/payment-security";

const secret = "local-test-secret";
const body = '{"eventType":"SUCCESSFUL_TRANSACTION"}';

test("accepts a SHA-512 signature over secret and raw body", () => {
  const signature = createHash("sha512").update(`${secret}${body}`).digest("hex");
  assert.equal(verifyMonnifySignature(body, signature, secret), true);
});

test("accepts an HMAC SHA-512 signature", () => {
  const signature = createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(verifyMonnifySignature(body, signature, secret), true);
});

test("rejects malformed, extended, and incorrect signatures", () => {
  const valid = createHash("sha512").update(`${secret}${body}`).digest("hex");
  assert.equal(verifyMonnifySignature(body, `${valid}00`, secret), false);
  assert.equal(verifyMonnifySignature(body, valid.slice(0, -2), secret), false);
  assert.equal(verifyMonnifySignature(body, "f".repeat(128), secret), false);
  assert.equal(verifyMonnifySignature(body, null, secret), false);
});

test("recognizes verified success statuses and rejects pending status", () => {
  assert.equal(isSuccessfulPaymentStatus("SUCCESSFUL_TRANSACTION"), true);
  assert.equal(isSuccessfulPaymentStatus("successful"), true);
  assert.equal(isSuccessfulPaymentStatus("PENDING"), false);
  assert.equal(isSuccessfulPaymentStatus(undefined), false);
  assert.equal(isFailedPaymentStatus("FAILED"), true);
  assert.equal(isFailedPaymentStatus("PENDING"), false);
});
