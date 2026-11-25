"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"checking" | "paid" | "failed">(
    reference ? "checking" : "failed",
  );

  useEffect(() => {
    if (!reference) return;
    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then(async (response) => ({
        response,
        data: await response.json(),
      }))
      .then(({ response, data }) => {
        if (response.ok && data.status === "PAID") {
          setStatus("paid");
          useCartStore.getState().clearCart();
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [reference]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-16">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center">
        {status === "checking" && <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-[#2168E8]" />}
        {status === "paid" && <CheckCircle2 className="mx-auto h-12 w-12 text-[#16A36A]" />}
        {status === "checking" && <h1 className="mt-4 text-2xl font-bold text-[#0B1F3A]">Verifying payment…</h1>}
        {status === "paid" && (
          <>
            <h1 className="mt-4 text-2xl font-bold text-[#0B1F3A]">Payment confirmed</h1>
            <p className="mt-3 text-slate-600">Your order has been received and confirmed.</p>
            <Link href="/account/orders" className="mt-6 inline-block rounded-lg bg-[#2168E8] px-5 py-3 font-bold text-white">View my orders</Link>
          </>
        )}
        {status === "failed" && (
          <>
            <h1 className="mt-4 text-2xl font-bold text-[#DC4545]">Payment not confirmed</h1>
            <p className="mt-3 text-slate-600">No order was marked paid. You can safely retry checkout.</p>
            <Link href="/cart" className="mt-6 inline-block rounded-lg border border-[#2168E8] px-5 py-3 font-bold text-[#2168E8]">Return to cart</Link>
          </>
        )}
      </div>
    </main>
  );
}
