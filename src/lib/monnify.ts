type MonnifyResponse = {
  requestSuccessful: boolean;
  responseMessage?: string;
  responseBody?: Record<string, unknown>;
};

export class MonnifyClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com").replace(/\/$/, "");
  }

  private credentials() {
    const apiKey = process.env.MONNIFY_API_KEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error("Monnify credentials are not configured");
    return { apiKey, secretKey };
  }

  private async token() {
    const { apiKey, secretKey } = this.credentials();
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`,
      },
      cache: "no-store",
    });
    const data = (await response.json()) as MonnifyResponse & {
      responseBody?: { accessToken: string };
    };
    if (!response.ok || !data.requestSuccessful || !data.responseBody?.accessToken) {
      throw new Error(data.responseMessage ?? "Unable to authenticate with Monnify");
    }
    return data.responseBody.accessToken;
  }

  async initialize(input: {
    amount: number;
    reference: string;
    customerName: string;
    customerEmail: string;
    redirectUrl: string;
  }) {
    const contractCode = process.env.MONNIFY_CONTRACT_CODE;
    if (!contractCode) throw new Error("MONNIFY_CONTRACT_CODE is not configured");
    const accessToken = await this.token();
    const response = await fetch(`${this.baseUrl}/api/v1/merchant/transactions/init-transaction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: (input.amount / 100).toFixed(2),
        currency: "NGN",
        contractCode,
        paymentReference: input.reference,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        paymentDescription: "GETBUY order payment",
        redirectUrl: input.redirectUrl,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
      }),
      cache: "no-store",
    });
    const data = (await response.json()) as MonnifyResponse;
    if (!response.ok || !data.requestSuccessful) {
      throw new Error(data.responseMessage ?? "Unable to initialize Monnify payment");
    }
    return data.responseBody as {
      checkoutUrl: string;
      transactionReference: string;
      paymentReference: string;
    };
  }

  async verify(reference: string) {
    const accessToken = await this.token();
    const candidates = [
      `${this.baseUrl}/api/v1/merchant/transactions/${encodeURIComponent(reference)}`,
      `${this.baseUrl}/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`,
    ];

    for (const url of candidates) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const data = (await response.json()) as MonnifyResponse;
      if (data.requestSuccessful) return data.responseBody;
    }
    throw new Error("Unable to verify Monnify transaction");
  }
}
