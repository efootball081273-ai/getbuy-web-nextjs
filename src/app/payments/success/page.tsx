import { Suspense } from "react";
import { PaymentSuccessContent } from "@/components/payment-success-content";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-16">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-bold text-[#0B1F3A]">Verifying payment…</p>
        </div>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
