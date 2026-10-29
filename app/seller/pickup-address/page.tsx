"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const API = "https://goldmart-backend-yoxc.onrender.com/api/seller/pickup-address";
type Address = {
  contact_name: string; contact_email: string; contact_phone: string;
  address_line1: string; address_line2: string; city: string;
  state: string; country: string; postal_code: string;
};
type ResponseData = { success: boolean; message?: string; address?: Address | null };
const empty: Address = {
  contact_name: "", contact_email: "", contact_phone: "",
  address_line1: "", address_line2: "", city: "", state: "",
  country: "Nigeria", postal_code: ""
};
const fields: { key: keyof Address; label: string; required?: boolean; placeholder?: string }[] = [
  { key: "contact_name", label: "Pickup contact name", required: true, placeholder: "Name of the person handing over parcels" },
  { key: "contact_email", label: "Contact email", required: true },
  { key: "contact_phone", label: "Contact phone number", required: true, placeholder: "+234..." },
  { key: "address_line1", label: "Pickup street address", required: true, placeholder: "Building number, street, landmark" },
  { key: "address_line2", label: "Apartment, shop or suite (optional)" },
  { key: "city", label: "City or town", required: true },
  { key: "state", label: "State / region (required for Nigeria)" },
  { key: "country", label: "Country", required: true },
  { key: "postal_code", label: "Postal code (optional)" }
];

export default function SellerPickupAddressPage() {
  const [form, setForm] = useState<Address>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const load = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("goldmart_token");
    if (!token) { setError("Sign in as a seller to manage pickup details."); setLoading(false); return; }
    try {
      const response = await fetch(API, {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store", signal
      });
      const data: ResponseData = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load pickup details.");
      if (!signal.aborted && data.address) { setForm(data.address); setSaved(true); }
    } catch (e) {
      if (!signal.aborted) setError(e instanceof Error ? e.message : "Unable to load pickup details.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) throw new Error("Sign in as a seller to save pickup details.");
      const response = await fetch(API, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data: ResponseData = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save pickup details.");
      if (data.address) setForm(data.address);
      setSaved(true);
      setNotice("Pickup details saved privately. They are not yet courier-validated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save pickup details.");
    } finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#0A1F1A]">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/seller" className="text-sm font-semibold text-[#0A1F1A] underline underline-offset-4">← Seller overview</Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#8B742E]">GoldMart Seller Studio</p>
        <h1 className="mt-2 text-3xl font-bold">Pickup address</h1>
        <p className="mt-2 text-sm text-[#52635D]">Save where your courier should collect orders. Use your business, shop, warehouse or other approved pickup location — not necessarily your home.</p>
      </div>
      <div className="rounded-2xl border border-[#E7D6A1] bg-[#FFFDF6] p-4 text-sm text-[#54451D]">
        <strong>Preparation only.</strong> These details are private to your seller account. Shipbubble address validation, courier rates and live bookings are not enabled by this form. Saving is free.
      </div>
      {loading ? <p role="status">Loading pickup details…</p> :
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-[#DFE5DC] bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Pickup contact & location</h2>
            <span className="rounded-full border border-[#E7D6A1] bg-[#FFF9E9] px-3 py-1 text-xs font-semibold text-[#725D1D]">{saved ? "Saved · not validated" : "Not saved"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => <label key={field.key} className={field.key === "address_line1" || field.key === "address_line2" ? "block sm:col-span-2" : "block"}>
              <span className="mb-1 block text-sm font-semibold">{field.label}</span>
              <input
                type={field.key === "contact_email" ? "email" : field.key === "contact_phone" ? "tel" : "text"}
                required={field.required || (field.key === "state" && form.country.trim().toLowerCase() === "nigeria")}
                autoComplete="off"
                maxLength={field.key === "address_line1" ? 300 : field.key === "address_line2" ? 200 : field.key === "contact_email" ? 254 : field.key === "contact_phone" ? 24 : field.key === "postal_code" ? 32 : 120}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={event => { setForm(current => ({ ...current, [field.key]: event.target.value })); setNotice(""); }}
                className="w-full rounded-xl border border-[#D5DED6] bg-[#FFFFFF] px-4 py-3 text-[#0A1F1A] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#F5E6A3]"
              />
            </label>)}
          </div>
          {error ? <p role="alert" className="rounded-xl bg-[#FFF0F0] p-3 text-sm text-[#8D2626]">{error}</p> : null}
          {notice ? <p role="status" className="rounded-xl bg-[#F1F8F0] p-3 text-sm text-[#245B35]">{notice}</p> : null}
          <button type="submit" disabled={saving} className="rounded-xl bg-[#0A1F1A] px-6 py-3 font-semibold text-[#F5E6A3] transition hover:bg-[#17372D] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving…" : "Save pickup details"}
          </button>
        </form>}
    </div>
  </main>;
}
