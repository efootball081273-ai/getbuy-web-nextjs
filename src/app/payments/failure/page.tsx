import Link from "next/link";

export default function PaymentFailurePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-16">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-[#DC4545]">Payment unsuccessful</h1>
        <p className="mt-3 text-slate-600">Your payment was not confirmed. No stock was deducted.</p>
        <Link href="/cart" className="mt-6 inline-block rounded-lg border border-[#2168E8] px-5 py-3 font-bold text-[#2168E8]">Return to cart</Link>
      </div>
    </main>
  );
}
