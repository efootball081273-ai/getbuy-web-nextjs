import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

const root = process.cwd();
const databaseFile = `.phase8-test-${process.pid}.db`;
const databasePath = join(root, "prisma", databaseFile);
const databaseUrl = `file:./prisma/${databaseFile}`;
const webhookSecret = "phase8-integration-test-secret";

let prisma: typeof import("../src/lib/prisma").prisma;
let postWebhook: typeof import("../src/app/api/webhooks/monnify/route").POST;
let postVerify: typeof import("../src/app/api/payments/verify/route").POST;

describe("Monnify webhook integration", () => {
  before(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.MONNIFY_SECRET_KEY = webhookSecret;
    process.env.MONNIFY_API_KEY = "phase8-integration-test-api-key";
    process.env.MONNIFY_BASE_URL = "https://monnify.integration.test";

    const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");
    const schemaResult = spawnSync(
      process.execPath,
      [prismaCli, "db", "push"],
      { cwd: root, env: process.env, encoding: "utf8" },
    );
    assert.equal(
      schemaResult.status,
      0,
      `${schemaResult.stdout}\n${schemaResult.stderr}`,
    );

    ({ prisma } = await import("../src/lib/prisma"));
    ({ POST: postWebhook } = await import("../src/app/api/webhooks/monnify/route"));
    ({ POST: postVerify } = await import("../src/app/api/payments/verify/route"));
  });

  after(async () => {
    if (prisma) await prisma.$disconnect();
    for (const suffix of ["", "-journal", "-shm", "-wal"]) {
      rmSync(`${databasePath}${suffix}`, { force: true });
    }
  });

  test("successful webhook is idempotent and decrements stock once", async () => {
    const fixture = await createPendingOrder();
    const body = successfulWebhookBody(fixture.reference, fixture.eventId, 13);

    const firstResponse = await sendWebhook(body);
    const secondResponse = await sendWebhook(body);

    assert.equal(firstResponse.status, 200);
    assert.deepEqual(await firstResponse.json(), { status: "PAID" });
    assert.equal(secondResponse.status, 200);
    assert.deepEqual(await secondResponse.json(), { status: "PAID" });

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: fixture.orderId },
    });
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
    });
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { reference: fixture.reference },
    });

    assert.equal(order.paymentStatus, "PAID");
    assert.equal(order.orderStatus, "CONFIRMED");
    assert.equal(product.stock, 4);
    assert.equal(payment.status, "SUCCESS");
    assert.equal(
      await prisma.webhookEvent.count({
        where: { provider: "MONNIFY", eventId: fixture.eventId },
      }),
      1,
    );
    assert.equal(
      await prisma.orderStatusHistory.count({
        where: { orderId: fixture.orderId, newStatus: "CONFIRMED" },
      }),
      1,
    );
  });

  test("webhook amount mismatch leaves order and inventory unchanged", async () => {
    const fixture = await createPendingOrder();
    const response = await sendWebhook(
      successfulWebhookBody(fixture.reference, fixture.eventId, 12),
    );

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "Transaction amount mismatch" });

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: fixture.orderId },
    });
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
    });

    assert.equal(order.paymentStatus, "UNPAID");
    assert.equal(product.stock, 5);
    assert.equal(
      await prisma.webhookEvent.count({
        where: { provider: "MONNIFY", eventId: fixture.eventId },
      }),
      0,
    );
  });

  test("webhook rejects an invalid signature before processing", async () => {
    const fixture = await createPendingOrder();
    const body = successfulWebhookBody(fixture.reference, fixture.eventId, 13);
    const response = await postWebhook(new Request("http://localhost/api/webhooks/monnify", {
      method: "POST",
      headers: { "content-type": "application/json", "monnify-signature": "invalid" },
      body,
    }));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Invalid signature" });
    assert.equal(
      await prisma.webhookEvent.count({
        where: { provider: "MONNIFY", eventId: fixture.eventId },
      }),
      0,
    );
  });

  test("provider verification confirms payment and decrements inventory once", async () => {
    const fixture = await createPendingOrder();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/api/v1/auth/login")) {
        return Response.json({
          requestSuccessful: true,
          responseBody: { accessToken: "integration-test-token" },
        });
      }
      return Response.json({
        requestSuccessful: true,
        responseBody: {
          paymentStatus: "PAID",
          paymentReference: fixture.reference,
          amountPaid: 13,
          currency: "NGN",
        },
      });
    };

    try {
      const response = await postVerify(new Request("http://localhost/api/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: fixture.reference }),
      }));

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        status: "PAID",
        orderId: fixture.orderId,
      });

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: fixture.orderId },
      });
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: fixture.productId },
      });
      assert.equal(order.paymentStatus, "PAID");
      assert.equal(product.stock, 4);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("pending provider status leaves order and inventory unchanged", async () => {
    const fixture = await createPendingOrder();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/api/v1/auth/login")) {
        return Response.json({
          requestSuccessful: true,
          responseBody: { accessToken: "integration-test-token" },
        });
      }
      return Response.json({
        requestSuccessful: true,
        responseBody: {
          paymentStatus: "PENDING",
          paymentReference: fixture.reference,
          amountPaid: 13,
          currency: "NGN",
        },
      });
    };

    try {
      const response = await postVerify(new Request("http://localhost/api/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: fixture.reference }),
      }));

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "PENDING" });

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: fixture.orderId },
      });
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: fixture.productId },
      });
      assert.equal(order.paymentStatus, "UNPAID");
      assert.equal(product.stock, 5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

async function createPendingOrder() {
  const suffix = randomUUID();
  const category = await prisma.category.create({
    data: { name: `Integration ${suffix}`, slug: `integration-${suffix}` },
  });
  const product = await prisma.product.create({
    data: {
      name: `Integration ${suffix}`,
      slug: `integration-${suffix}`,
      description: "Webhook integration test product",
      price: 1200,
      stock: 5,
      sku: `TEST-${suffix}`,
      images: "[]",
      categoryId: category.id,
    },
  });
  const reference = `TEST-${suffix}`;
  const eventId = `EVENT-${suffix}`;
  const order = await prisma.order.create({
    data: {
      orderNumber: `GB-${suffix}`,
      customerName: "Integration Test",
      customerEmail: "integration@example.test",
      customerPhone: "08000000000",
      deliveryAddress: "1 Test Street",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      subtotal: 1200,
      deliveryFee: 100,
      total: 1300,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      paymentReference: reference,
      items: {
        create: {
          productId: product.id,
          productName: product.name,
          productPrice: 1200,
          quantity: 1,
          subtotal: 1200,
        },
      },
      payments: {
        create: {
          provider: "MONNIFY",
          reference,
          amount: 1300,
          status: "PENDING",
        },
      },
    },
  });

  return { orderId: order.id, productId: product.id, reference, eventId };
}

function successfulWebhookBody(reference: string, eventId: string, amount: number) {
  return JSON.stringify({
    eventId,
    eventType: "SUCCESSFUL_TRANSACTION",
    eventData: {
      paymentStatus: "PAID",
      paymentReference: reference,
      amountPaid: amount,
      currency: "NGN",
    },
  });
}

async function sendWebhook(body: string) {
  const signature = createHash("sha512")
    .update(`${webhookSecret}${body}`)
    .digest("hex");
  return postWebhook(new Request("http://localhost/api/webhooks/monnify", {
    method: "POST",
    headers: { "content-type": "application/json", "monnify-signature": signature },
    body,
  }));
}
