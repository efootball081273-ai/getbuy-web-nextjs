"use client";

import { useState } from "react";
import Link from "next/link";
import { registerCustomer } from "@/app/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await registerCustomer(formData);
    if (result.error) setError(result.error);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <form action={handleSubmit} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Shop, save favourites and track orders.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {[
          ["name", "Full name", "text", "name"],
          ["email", "Email", "email", "email"],
          ["phone", "Phone number", "tel", "tel"],
          ["password", "Password", "password", "new-password"],
          ["confirmPassword", "Confirm password", "password", "new-password"],
        ].map(([name, label, type, autoComplete]) => (
          <label key={name} className="mt-4 block text-sm font-medium text-slate-700">
            {label}
            <input name={name} type={type} required minLength={name.includes("password") ? 8 : undefined} autoComplete={autoComplete} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" />
          </label>
        ))}
        <button type="submit" className="mt-6 w-full rounded-lg bg-[#2168E8] px-4 py-3 font-semibold text-white">Create account</button>
        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-[#2168E8]">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
