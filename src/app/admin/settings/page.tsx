import { updateStoreSettings } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await prisma.storeSetting.findUnique({ where: { id: "default" } });

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-bold text-[#2168E8]">Configuration</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0B1F3A]">Store settings</h1>
      </header>
      <form action={updateStoreSettings} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Store name<input required name="storeName" defaultValue={settings?.storeName ?? "GETBUY"} className="admin-input" /></label>
          <label className="text-sm font-medium">Logo URL<input name="logo" type="url" defaultValue={settings?.logo ?? ""} className="admin-input" /></label>
          <label className="text-sm font-medium">Contact email<input name="contactEmail" type="email" defaultValue={settings?.contactEmail ?? ""} className="admin-input" /></label>
          <label className="text-sm font-medium">Contact phone<input name="contactPhone" defaultValue={settings?.contactPhone ?? ""} className="admin-input" /></label>
          <label className="text-sm font-medium">Delivery fee (NGN)<input required name="deliveryFee" type="number" min="0" step="1" defaultValue={(settings?.deliveryFee ?? 0) / 100} className="admin-input" /></label>
          <label className="text-sm font-medium md:col-span-2">Store policies<textarea name="policies" rows={4} defaultValue={settings?.policies ?? ""} className="admin-input" /></label>
          <label className="text-sm font-medium md:col-span-2">Social media links (JSON or notes)<textarea name="socialLinks" rows={3} defaultValue={settings?.socialLinks ?? ""} className="admin-input" /></label>
        </div>
        <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Payment credentials are intentionally not editable here. Keep Monnify and Paystack secrets in server environment variables.
        </div>
        <button className="mt-5 rounded-lg bg-[#2168E8] px-5 py-3 text-sm font-bold text-white">Save settings</button>
      </form>
    </main>
  );
}
