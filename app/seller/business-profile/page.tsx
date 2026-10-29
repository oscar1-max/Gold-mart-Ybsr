"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const API = "https://goldmart-backend-yoxc.onrender.com/api/seller/profile";
type Profile = {
  business_name: string;
  country_code: string;
  business_city: string;
  business_region: string;
  preferred_currency: string;
};
type ResponseData = { success: boolean; message?: string; profile?: Profile | null };
const blank: Profile = {
  business_name: "", country_code: "NG", business_city: "",
  business_region: "", preferred_currency: "NGN"
};
const countries = [
  ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["ZA", "South Africa"],
  ["GB", "United Kingdom"], ["US", "United States"], ["CA", "Canada"],
  ["DE", "Germany"], ["FR", "France"], ["IE", "Ireland"], ["NL", "Netherlands"],
  ["AE", "United Arab Emirates"], ["IN", "India"], ["CN", "China"], ["JP", "Japan"],
  ["AU", "Australia"]
];
const currencies = [
  ["NGN", "Nigerian naira (NGN)"], ["USD", "US dollar (USD)"],
  ["GBP", "British pound (GBP)"], ["EUR", "Euro (EUR)"]
];

export default function SellerBusinessProfilePage() {
  const [form, setForm] = useState<Profile>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("goldmart_token");
    if (!token) { setError("Sign in as a seller to manage your business profile."); setLoading(false); return; }
    try {
      const response = await fetch(API, {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store", signal
      });
      const data: ResponseData = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load business profile.");
      if (!signal.aborted && data.profile) { setForm(data.profile); setSaved(true); }
    } catch (e) {
      if (!signal.aborted) setError(e instanceof Error ? e.message : "Unable to load business profile.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm(current => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) throw new Error("Sign in as a seller to save your profile.");
      const response = await fetch(API, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data: ResponseData = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save business profile.");
      if (data.profile) setForm(data.profile);
      setSaved(true);
      setNotice("Business profile saved privately. International shipping and payouts are not enabled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save business profile.");
    } finally { setSaving(false); }
  }

  const fieldClass = "mt-1 w-full rounded-xl border border-[#D5DED6] bg-white px-4 py-3 text-[#0A1F1A] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#F5E6A3]";
  return <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#0A1F1A]">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/seller" className="text-sm font-semibold underline underline-offset-4">← Seller overview</Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#8B742E]">GoldMart Seller Studio</p>
        <h1 className="mt-2 text-3xl font-bold">Business location & currency</h1>
        <p className="mt-2 text-sm text-[#52635D]">Prepare your store to operate from Nigeria or another country. Enter your actual business location.</p>
      </header>
      <div className="rounded-2xl border border-[#E7D6A1] bg-[#FFFDF6] p-4 text-sm text-[#54451D]">
        <strong>Preparation only.</strong> This private profile does not verify your business, enable foreign payouts, or guarantee courier pickup or international checkout. Product prices and existing orders will not be changed.
      </div>
      {loading ? <p role="status">Loading business profile…</p> :
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-[#DFE5DC] bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Business details</h2>
            <span className="rounded-full border border-[#E7D6A1] bg-[#FFF9E9] px-3 py-1 text-xs font-semibold text-[#725D1D]">{saved ? "Saved" : "Not saved"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Business or store name (optional)</span>
              <input className={fieldClass} maxLength={150} value={form.business_name} onChange={e => set("business_name", e.target.value)} placeholder="Your store or trading name" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Operating country</span>
              <select className={fieldClass} required value={form.country_code} onChange={e => set("country_code", e.target.value)}>
                {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                {!countries.some(([code]) => code === form.country_code) && <option value={form.country_code}>{form.country_code}</option>}
              </select>
              <span className="mt-1 block text-xs text-[#52635D]">More countries can be added to this selector as GoldMart expands.</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Preferred currency</span>
              <select className={fieldClass} required value={form.preferred_currency} onChange={e => set("preferred_currency", e.target.value)}>
                {currencies.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
              <span className="mt-1 block text-xs text-[#52635D]">A preference only. No automatic price conversion or payouts.</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Business city or town</span>
              <input className={fieldClass} required minLength={2} maxLength={120} value={form.business_city} onChange={e => set("business_city", e.target.value)} placeholder="e.g. London" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">State or region {form.country_code === "NG" ? "(required)" : "(optional)"}</span>
              <input className={fieldClass} required={form.country_code === "NG"} maxLength={120} value={form.business_region} onChange={e => set("business_region", e.target.value)} placeholder="e.g. Rivers / Greater London" />
            </label>
          </div>
          <p className="text-sm text-[#52635D]">For courier collection, manage your actual <Link href="/seller/pickup-address" className="font-semibold underline">pickup address</Link> separately.</p>
          {error && <p role="alert" className="rounded-xl bg-[#FFF0F0] p-3 text-sm text-[#8D2626]">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-[#F1F8F0] p-3 text-sm text-[#245B35]">{notice}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-[#0A1F1A] px-6 py-3 font-semibold text-[#F5E6A3] hover:bg-[#17372D] disabled:opacity-50">{saving ? "Saving…" : "Save business profile"}</button>
        </form>}
    </div>
  </main>;
}
