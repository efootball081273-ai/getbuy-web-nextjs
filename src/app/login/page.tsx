"use client";

import { useState } from "react";
import Link from "next/link";
import { loginCustomer } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await loginCustomer(formData);
    if (result.error) setError(result.error);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <form
        action={handleSubmit}
        className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to your GETBUY account.</p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" />
        </label>
        <button type="submit" className="mt-6 w-full rounded-lg bg-[#2168E8] px-4 py-3 font-semibold text-white">
          Sign in
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          New to GETBUY?{" "}
          <Link href="/register" className="font-semibold text-[#2168E8]">Create account</Link>
        </p>
      </form>
    </main>
  );
}
