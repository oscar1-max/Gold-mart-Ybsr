"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Readiness = {
 status: string; origin_country_code: string|null; pickup_country_code: string|null;
 pickup_matches_profile: boolean|null; business_profile_saved: boolean;
 pickup_address_saved: boolean; courier_bookings_enabled: false;
 shipping_checkout_enabled: false; international_payouts_enabled: false;
};
const messages: Record<string,string> = {
 missing_business_profile: "Save your seller business profile first.",
 missing_pickup_address: "Save the address where couriers would collect your parcels.",
 pickup_country_mismatch: "Your business country and pickup country do not match. Please correct your information.",
 awaiting_courier_integration: "Your saved business country matches your pickup country. Courier integration is still pending."
};
export default function ShippingReadinessPage() {
 const [data,setData]=useState<Readiness|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try {
    const token=localStorage.getItem("goldmart_token");
    if(!token) throw new Error("Sign in as a seller to check shipping preparation.");
    const response=await fetch("https://goldmart-backend-yoxc.onrender.com/api/seller/profile/shipping-readiness",{
     headers:{Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal
    });
    const json=await response.json();
    if(!response.ok||!json.success)throw new Error(json.message||"Unable to check shipping readiness.");
    if(!controller.signal.aborted)setData(json.readiness);
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to check shipping readiness.");}
   finally{if(!controller.signal.aborted)setLoading(false);}
  }
  void load();return()=>controller.abort();
 },[]);
 return <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#0A1F1A]">
  <div className="mx-auto max-w-3xl space-y-5">
   <Link href="/seller" className="text-sm font-semibold underline">← Seller overview</Link>
   <header><p className="text-xs font-bold uppercase tracking-widest text-[#8B742E]">GoldMart Seller Studio</p>
   <h1 className="mt-2 text-3xl font-bold">Shipping preparation</h1>
   <p className="mt-2 text-sm text-[#52635D]">Check your business and pickup countries before future courier setup.</p></header>
   <section className="rounded-2xl border border-[#E7D6A1] bg-[#FFFDF6] p-5">
    <p className="font-bold">Preparation only — not available for live delivery</p>
    <p className="mt-2 text-sm">This check does not validate addresses, confirm courier coverage, provide shipping prices, enable checkout, or activate foreign payouts.</p>
   </section>
   {loading?<p role="status">Checking your saved details…</p>:error?<p role="alert" className="rounded-xl bg-white p-4 text-[#9A2626]">{error}</p>:data&&
   <section className="space-y-4 rounded-2xl border border-[#DFE5DC] bg-white p-6">
    <h2 className="text-xl font-bold">{messages[data.status]?"Shipping setup status":"Shipping preparation unavailable"}</h2>
    <p role="status" className="text-sm">{messages[data.status]||"Please review your business and pickup details."}</p>
    <dl className="grid grid-cols-2 gap-4 text-sm">
     <div><dt className="text-[#52635D]">Business country</dt><dd className="font-semibold">{data.origin_country_code||"Not saved"}</dd></div>
     <div><dt className="text-[#52635D]">Pickup country</dt><dd className="font-semibold">{data.pickup_country_code||"Not saved or unrecognized"}</dd></div>
     <div><dt className="text-[#52635D]">Country match</dt><dd className="font-semibold">{data.pickup_matches_profile===true?"Yes":data.pickup_matches_profile===false?"No":"Not checked"}</dd></div>
     <div><dt className="text-[#52635D]">Courier bookings</dt><dd className="font-semibold">Disabled</dd></div>
    </dl>
    <div className="flex flex-wrap gap-4 pt-2 text-sm font-semibold">
     <Link href="/seller/business-profile" className="underline underline-offset-4">Edit business profile</Link>
     <Link href="/seller/pickup-address" className="underline underline-offset-4">Edit pickup address</Link>
    </div>
   </section>}
  </div>
 </main>;
}
