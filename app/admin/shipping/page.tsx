"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Address = {
  address_code: number;
  name: string;
  formatted_address: string;
  city: string;
  state: string;
  country: string;
};
type Category = { category_id: number; category: string };
type Shipment = {
  provider_order_id: string;
  status: string;
  courier_name: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  created_at: string | null;
};
type ShipmentsResponse = {
  success: boolean;
  message?: string;
  shipments?: Shipment[];
  page_limited?: boolean;
};

type Rate = {
  courier_id: string | number;
  courier_name: string;
  service_type: string;
  price: number;
  currency: string;
  pickup_eta?: string | null;
  delivery_eta?: string | null;
  insurance_available?: boolean;
};
type SupportDiagnostic = {
  provider_http_status: number | null;
  provider_endpoint: string;
  format: string;
  redaction_note: string;
  provider_response_redacted: string;
};

type ApiResponse = {
  success: boolean;
  support_diagnostic?: SupportDiagnostic | null;
  message?: string;
  addresses?: Address[];
  categories?: Category[];
  rates?: Rate[];
  address?: Address;
};

const fieldClass =
  "w-full rounded-xl border border-[#D6DCD5] bg-white px-3 py-3 text-[#0A1F1A] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#F5E6A3]";
const labelClass = "mb-1 block text-sm font-semibold text-[#0A1F1A]";

function dateToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function AdminShippingPage() {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  // Kept only in this page's memory, not localStorage, URL parameters or logs.
  const [supportDiagnostic, setSupportDiagnostic] = useState<SupportDiagnostic | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [addressName, setAddressName] = useState("");
  const [addressEmail, setAddressEmail] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [confirmCredit, setConfirmCredit] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentsLoaded, setShipmentsLoaded] = useState(false);
  const [shipmentsBusy, setShipmentsBusy] = useState(false);
  const [shipmentsError, setShipmentsError] = useState("");

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [category, setCategory] = useState("");
  const [pickupDate, setPickupDate] = useState(dateToday);
  const [itemName, setItemName] = useState("Test parcel");
  const [description, setDescription] = useState("GoldMart shipping rate preview");
  const [weight, setWeight] = useState("1");
  const [value, setValue] = useState("5000");
  const [quantity, setQuantity] = useState("1");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("15");
  const [height, setHeight] = useState("10");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    setRates([]);
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setError("Please sign in to your GoldMart admin account first.");
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      const [addressResponse, categoryResponse] = await Promise.all([
        fetch(`${API_URL}/api/shipping/addresses`, { headers, signal, cache: "no-store" }),
        fetch(`${API_URL}/api/shipping/categories`, { headers, signal, cache: "no-store" }),
      ]);
      const addressData: ApiResponse = await addressResponse.json();
      const categoryData: ApiResponse = await categoryResponse.json();
      if (!addressResponse.ok || !addressData.success) {
        throw new Error(addressResponse.status === 403
          ? "This account is not authorized to view shipping addresses."
          : addressData.message || "Unable to load Shipbubble addresses.");
      }
      if (!categoryResponse.ok || !categoryData.success) {
        throw new Error(categoryData.message || "Unable to load Shipbubble categories.");
      }
      if (signal?.aborted) return;
      const nextAddresses = addressData.addresses || [];
      const nextCategories = categoryData.categories || [];
      setAddresses(nextAddresses);
      setCategories(nextCategories);
      setSender((old) => nextAddresses.some((a) => String(a.address_code) === old)
        ? old : String(nextAddresses[0]?.address_code || ""));
      setReceiver((old) => nextAddresses.some((a) => String(a.address_code) === old)
        ? old : String(nextAddresses[1]?.address_code || ""));
      setCategory((old) => nextCategories.some((c) => String(c.category_id) === old)
        ? old : String(nextCategories[0]?.category_id || ""));
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "Unable to load shipping information.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // New validated addresses must be selectable immediately, without a refresh.
  useEffect(() => {
    if (!addresses.length) return;
    setSender((current) => addresses.some((a) => String(a.address_code) === current)
      ? current : String(addresses[0].address_code));
    setReceiver((current) => addresses.some((a) => String(a.address_code) === current)
      ? current : String(addresses[1]?.address_code || ""));
  }, [addresses]);

  async function loadShipments() {
    if (shipmentsBusy) return;
    setShipmentsBusy(true);
    setShipmentsError("");
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) throw new Error("Please sign in to your GoldMart admin account.");
      const response = await fetch(`${API_URL}/api/shipping/shipments`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json()) as ShipmentsResponse;
      if (!response.ok || !data.success || !Array.isArray(data.shipments)) {
        throw new Error(response.status === 403
          ? "Only GoldMart administrators can view Shipbubble shipments."
          : data.message || "Unable to load Shipbubble shipments.");
      }
      setShipments(data.shipments);
      setShipmentsLoaded(true);
    } catch (err) {
      setShipmentsError(err instanceof Error ? err.message : "Unable to load shipments.");
    } finally {
      setShipmentsBusy(false);
    }
  }

  async function validateAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validating || !confirmCredit) return;
    setValidating(true);
    setAddressError("");
    setAddressSuccess("");
    setSupportDiagnostic(null);
    setCopyMessage("");
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setAddressError("Sign in to your GoldMart admin account first.");
      setValidating(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/shipping/addresses/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: addressName.trim(),
          email: addressEmail.trim(),
          phone: addressPhone.trim(),
          address: addressText.trim(),
          confirm_validation_charge: true,
        }),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success || !data.address) {
        if (data.support_diagnostic?.format === "redacted_json_reconstruction") {
          setSupportDiagnostic(data.support_diagnostic);
        }
        throw new Error(data.message || "Unable to validate address.");
      }
      const added = data.address;
      setAddresses((old) => old.some((a) => a.address_code === added.address_code)
        ? old : [...old, added]);
      setAddressSuccess(`Address validated successfully. Address code: ${added.address_code}`);
      setAddressName("");
      setAddressEmail("");
      setAddressPhone("");
      setAddressText("");
      setConfirmCredit(false);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Address validation failed.");
    } finally {
      setValidating(false);
    }
  }

  // Copy is an explicit admin action: never email or upload diagnostics automatically.
  async function copySupportDiagnostic() {
    if (!supportDiagnostic) return;
    setCopyMessage("");
    try {
      const payload = {
        ticket: "44813",
        source: "GoldMart admin (redacted Shipbubble diagnostic)",
        provider_http_status: supportDiagnostic.provider_http_status,
        provider_endpoint: supportDiagnostic.provider_endpoint,
        format: supportDiagnostic.format,
        redaction_note: supportDiagnostic.redaction_note,
        provider_response_redacted: supportDiagnostic.provider_response_redacted,
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyMessage("Redacted diagnostic copied. Review it before sharing with Shipbubble support.");
    } catch {
      setCopyMessage("Unable to copy automatically. Select and copy the redacted diagnostic text below.");
    }
  }

  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuoteError("");
    setRates([]);
    if (!sender || !receiver || sender === receiver) {
      setQuoteError("Select two different validated pickup and delivery addresses.");
      return;
    }
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setQuoteError("Please sign in again.");
      return;
    }
    setQuoting(true);
    try {
      const response = await fetch(`${API_URL}/api/shipping/preview-rates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_address_code: Number(sender),
          reciever_address_code: Number(receiver),
          category_id: Number(category),
          pickup_date: pickupDate,
          package_items: [{
            name: itemName,
            description,
            unit_weight: Number(weight),
            unit_amount: Number(value),
            quantity: Number(quantity),
          }],
          length: Number(length),
          width: Number(width),
          height: Number(height),
        }),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch live courier rates.");
      }
      setRates(data.rates || []);
      if (!data.rates?.length) {
        setQuoteError("Shipbubble returned no courier rates for these addresses and parcel details.");
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Shipping rate request failed.");
    } finally {
      setQuoting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#0F0F0F] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-semibold text-[#0A1F1A] hover:underline">
          ← Admin overview
        </Link>
        <header className="mt-5 rounded-3xl bg-[#0A1F1A] p-6 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5E6A3]">GoldMart admin · Shipbubble</p>
          <h1 className="mt-3 text-3xl font-bold">Delivery rate testing</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Check validated addresses and live courier quotations. This page cannot book shipments,
            charge customers, or debit the Shipbubble wallet.
          </p>
        </header>

        <div className="mt-6 rounded-2xl border border-[#E3E6DF] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#0A1F1A]">Shipbubble connection</h2>
            <button type="button" onClick={() => void load()} disabled={loading}
              className="rounded-xl border border-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A1F1A] disabled:opacity-50">
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-[#FFF3EF] p-3 text-sm text-[#822B22]">{error}</p>}
          {loading ? <p className="mt-4 text-sm">Loading validated addresses and categories…</p> : !error && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F7F7F5] p-4">
                <p className="text-sm text-[#4A5850]">Validated addresses</p>
                <p className="mt-1 text-3xl font-bold text-[#0A1F1A]">{addresses.length}</p>
              </div>
              <div className="rounded-xl bg-[#F7F7F5] p-4">
                <p className="text-sm text-[#4A5850]">Package categories</p>
                <p className="mt-1 text-3xl font-bold text-[#0A1F1A]">{categories.length}</p>
              </div>
            </div>
          )}
          {!loading && !error && addresses.length < 2 && (
            <p className="mt-4 rounded-xl border border-[#E6D89B] bg-[#FFFBE9] p-4 text-sm text-[#4B401C]">
              At least two validated addresses are needed to test a route. Add a pickup address
              and a delivery address in Shipbubble, then refresh. Address validation may use credits.
            </p>
          )}
        </div>

        <section className="mt-6 rounded-2xl border border-[#E3E6DF] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#0A1F1A]">Shipbubble shipment tracking</h2>
              <p className="mt-1 text-sm text-[#4A5850]">
                View existing Shipbubble shipments only. This cannot create shipments,
                change delivery status, or debit your wallet.
              </p>
            </div>
            <button type="button" onClick={() => void loadShipments()} disabled={shipmentsBusy}
              className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0A1F1A] disabled:opacity-50">
              {shipmentsBusy ? "Checking shipments…" : shipmentsLoaded ? "Refresh shipments" : "Check shipments"}
            </button>
          </div>
          {shipmentsError && <p role="alert" className="mt-4 rounded-xl bg-[#FFF3EF] p-3 text-sm text-[#822B22]">{shipmentsError}</p>}
          {!shipmentsLoaded && !shipmentsBusy && !shipmentsError && (
            <p className="mt-4 text-sm text-[#4A5850]">Choose Check shipments to read existing tracking records.</p>
          )}
          {shipmentsLoaded && !shipmentsBusy && shipments.length === 0 && (
            <p role="status" className="mt-4 rounded-xl bg-[#F7F7F5] p-4 text-sm text-[#4A5850]">
              No Shipbubble shipments were returned. GoldMart has not booked any courier deliveries.
            </p>
          )}
          {shipmentsLoaded && shipments.length > 0 && (
            <div className="mt-4 space-y-3" aria-live="polite">
              {shipments.map((shipment) => (
                <article key={shipment.provider_order_id}
                  className="rounded-xl border border-[#E3E6DF] bg-[#F7F7F5] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#0A1F1A]">Shipbubble order {shipment.provider_order_id}</p>
                    <span className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold capitalize text-[#0A1F1A]">
                      {shipment.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#4A5850]">
                    Courier: {shipment.courier_name || "Not assigned"}
                    {shipment.tracking_code ? ` · Tracking: ${shipment.tracking_code}` : ""}
                  </p>
                  {shipment.created_at && <p className="mt-1 text-xs text-[#4A5850]">Provider date: {shipment.created_at}</p>}
                  {shipment.tracking_url && (
                    <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-[#0A1F1A] underline underline-offset-4">
                      Open courier tracking
                    </a>
                  )}
                </article>
              ))}
              <p className="text-xs text-[#4A5850]">
                Showing up to 50 records from the first Shipbubble results page; this is not a complete shipment history.
              </p>
            </div>
          )}
        </section>

        <form onSubmit={validateAddress} className="mt-6 rounded-2xl border border-[#E3E6DF] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold text-[#0A1F1A]">Add shipping address</h2>
          <p className="mt-2 text-sm text-[#4A5850]">
            Validate a real pickup or delivery address through Shipbubble. Include street,
            city, state and country. Successful validations may use Shipbubble credits.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gm-address-name" className={labelClass}>Full name</label>
              <input id="gm-address-name" className={fieldClass} value={addressName}
                onChange={(e) => setAddressName(e.target.value)} maxLength={120} minLength={2}
                autoComplete="name" required />
            </div>
            <div>
              <label htmlFor="gm-address-email" className={labelClass}>Email</label>
              <input id="gm-address-email" className={fieldClass} type="email" value={addressEmail}
                onChange={(e) => setAddressEmail(e.target.value)} maxLength={254}
                autoComplete="email" required />
            </div>
            <div>
              <label htmlFor="gm-address-phone" className={labelClass}>Phone number</label>
              <input id="gm-address-phone" className={fieldClass} type="tel" value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value)} maxLength={23}
                autoComplete="tel" placeholder="+2348012345678" required />
            </div>
            <div>
              <label htmlFor="gm-address-full" className={labelClass}>Full street address</label>
              <input id="gm-address-full" className={fieldClass} value={addressText}
                onChange={(e) => setAddressText(e.target.value)} maxLength={350} minLength={12}
                autoComplete="street-address" placeholder="Street, city, state, Nigeria" required />
            </div>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-[#0A1F1A]">
            <input type="checkbox" checked={confirmCredit} onChange={(e) => setConfirmCredit(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#D4AF37]" required />
            I understand Shipbubble may deduct an address-validation credit or charge
            for a successful validation. This does not book a shipment.
          </label>
          {addressError && <p role="alert" className="mt-4 rounded-xl bg-[#FFF3EF] p-3 text-sm text-[#822B22]">{addressError}</p>}
          {supportDiagnostic && (
            <section className="mt-5 rounded-2xl border border-[#D4AF37] bg-[#F7F7F5] p-4 sm:p-5"
              aria-label="Redacted Shipbubble support diagnostic">
              <h3 className="text-lg font-bold text-[#0A1F1A]">Shipbubble support diagnostic · Ticket #44813</h3>
              <p className="mt-2 text-sm text-[#3F5048]">
                This is a privacy-filtered summary returned by GoldMart, not Shipbubble's original raw response.
                It may omit important details. Review it carefully before sharing; never include API keys,
                access tokens, customer contact information or private addresses.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#0A1F1A]">
                Upstream HTTP status: {supportDiagnostic.provider_http_status ?? "Unavailable"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copySupportDiagnostic()}
                  className="rounded-xl bg-[#0A1F1A] px-4 py-2.5 text-sm font-bold text-white">
                  Copy redacted summary
                </button>
                <button type="button" onClick={() => { setSupportDiagnostic(null); setCopyMessage(""); }}
                  className="rounded-xl border border-[#ABB7AD] bg-white px-4 py-2.5 text-sm font-bold text-[#0A1F1A]">
                  Clear diagnostic
                </button>
              </div>
              {copyMessage && <p role="status" className="mt-3 text-sm text-[#3F5048]">{copyMessage}</p>}
              <label htmlFor="gm-support-diagnostic" className="mt-4 block text-sm font-semibold text-[#0A1F1A]">
                Redacted response (review before sending)
              </label>
              <textarea id="gm-support-diagnostic" readOnly rows={8}
                value={JSON.stringify({
                  provider_http_status: supportDiagnostic.provider_http_status,
                  provider_endpoint: supportDiagnostic.provider_endpoint,
                  format: supportDiagnostic.format,
                  redaction_note: supportDiagnostic.redaction_note,
                  provider_response_redacted: supportDiagnostic.provider_response_redacted,
                }, null, 2)}
                className="mt-2 w-full rounded-xl border border-[#C5CCC3] bg-white p-3 font-mono text-xs text-[#0A1F1A]"
                aria-label="Redacted Shipbubble response"/>
            </section>
          )}
          {addressSuccess && <p role="status" className="mt-4 rounded-xl bg-[#F5E6A3] p-3 text-sm font-semibold text-[#0A1F1A]">{addressSuccess}</p>}
          <button type="submit" disabled={validating || !confirmCredit}
            className="mt-5 rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-[#0A1F1A] disabled:opacity-50">
            {validating ? "Validating address…" : "Validate shipping address"}
          </button>
        </form>

        {!loading && !error && addresses.length >= 2 && categories.length > 0 && (
          <form onSubmit={preview} className="mt-6 rounded-2xl border border-[#E3E6DF] bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold text-[#0A1F1A]">Preview live delivery prices</h2>
            <p className="mt-1 text-sm text-[#4A5850]">Use real parcel weight, dimensions and declared value for accurate quotes.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gm-sender" className={labelClass}>Pickup address</label>
                <select id="gm-sender" className={fieldClass} value={sender} onChange={(e) => setSender(e.target.value)} required>
                  {addresses.map((a) => <option key={a.address_code} value={a.address_code}>
                    {a.name || "Pickup"} — {a.formatted_address || a.city || a.address_code}
                  </option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gm-receiver" className={labelClass}>Delivery address</label>
                <select id="gm-receiver" className={fieldClass} value={receiver} onChange={(e) => setReceiver(e.target.value)} required>
                  <option value="">Choose an address</option>
                  {addresses.map((a) => <option key={a.address_code} value={a.address_code}>
                    {a.name || "Recipient"} — {a.formatted_address || a.city || a.address_code}
                  </option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gm-category" className={labelClass}>Package category</label>
                <select id="gm-category" className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value)} required>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gm-date" className={labelClass}>Pickup date (next 7 days)</label>
                <input id="gm-date" className={fieldClass} type="date" min={dateToday()} value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="gm-item" className={labelClass}>Item name</label>
                <input id="gm-item" className={fieldClass} value={itemName} onChange={(e) => setItemName(e.target.value)} maxLength={120} required />
              </div>
              <div>
                <label htmlFor="gm-desc" className={labelClass}>Description</label>
                <input id="gm-desc" className={fieldClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={150} required />
              </div>
              {([
                ["weight", "Weight (kg)", weight, setWeight, "0.01"],
                ["value", "Declared value (NGN)", value, setValue, "1"],
                ["quantity", "Quantity", quantity, setQuantity, "1"],
                ["length", "Length (cm)", length, setLength, "0.1"],
                ["width", "Width (cm)", width, setWidth, "0.1"],
                ["height", "Height (cm)", height, setHeight, "0.1"],
              ] as const).map(([key, label, val, setter, step]) => (
                <div key={key}>
                  <label htmlFor={`gm-${key}`} className={labelClass}>{label}</label>
                  <input id={`gm-${key}`} type="number" className={fieldClass} value={val}
                    onChange={(e) => setter(e.target.value)} step={step} min={step} required />
                </div>
              ))}
            </div>
            {quoteError && <p role="alert" className="mt-4 rounded-xl bg-[#FFF3EF] p-3 text-sm text-[#822B22]">{quoteError}</p>}
            <button type="submit" disabled={quoting}
              className="mt-6 w-full rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-[#0A1F1A] disabled:opacity-50 sm:w-auto">
              {quoting ? "Requesting quotes…" : "Get live delivery rates"}
            </button>
          </form>
        )}

        {rates.length > 0 && (
          <section className="mt-6 rounded-2xl border border-[#E3E6DF] bg-white p-5 sm:p-7" aria-live="polite">
            <h2 className="text-xl font-bold text-[#0A1F1A]">Courier quotations</h2>
            <p className="mt-1 text-sm text-[#4A5850]">For testing only. No shipment has been booked.</p>
            <div className="mt-4 grid gap-3">
              {rates.map((rate, i) => (
                <div key={`${rate.courier_id}-${rate.service_type}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E3E6DF] p-4">
                  <div>
                    <p className="font-bold text-[#0A1F1A]">{rate.courier_name || "Courier"}</p>
                    <p className="mt-1 text-sm text-[#4A5850]">
                      {rate.service_type === "dropoff" ? "Drop-off service" : rate.service_type === "pickup" ? "Pickup service" : "Delivery service"}
                      {rate.delivery_eta ? ` · ${rate.delivery_eta}` : ""}
                    </p>
                  </div>
                  <strong className="text-xl text-[#0A1F1A]">
                    {rate.currency} {rate.price.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
