"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/product";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const [deliveryFee, setDeliveryFee] = useState(250000);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
      })
      .catch(() => undefined);
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const delivery = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      country: "Nigeria",
    };
    const idempotencyKey = crypto.randomUUID();

    try {
      const createResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          delivery,
        }),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error ?? "Unable to create order");

      const paymentResponse = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: created.orderId }),
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.error ?? "Unable to initialize payment");

      window.location.assign(payment.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold text-[#0B1F3A]">Secure checkout</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-slate-600">Redirecting to your cart…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">Delivery information</h2>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["fullName", "Full name", "text", "name"],
                ["email", "Email address", "email", "email"],
                ["phone", "Phone number", "tel", "tel"],
                ["city", "City", "text", "address-level2"],
                ["state", "State", "text", "address-level1"],
              ].map(([name, label, type, autoComplete]) => (
                <label key={name} className="text-sm font-medium text-slate-700">
                  {label}
                  <input name={name} type={type} required autoComplete={autoComplete} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Delivery address
                <input name="address" required autoComplete="street-address" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Country
                <input value="Nigeria" readOnly className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3" />
              </label>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">Order summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-600">{item.name} × {item.quantity}</span>
                  <strong className="shrink-0">{formatNaira(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><strong>{formatNaira(subtotal)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-600">Delivery fee</span><strong>{formatNaira(deliveryFee)}</strong></div>
              <div className="flex justify-between text-lg"><span className="font-bold text-[#0B1F3A]">Total</span><strong>{formatNaira(total)}</strong></div>
            </div>
            <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2168E8] px-4 py-3 font-bold text-white disabled:bg-slate-400">
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
              {submitting ? "Processing…" : "Pay securely"}
            </button>
          </aside>
        </form>
      )}
    </main>
  );
}
