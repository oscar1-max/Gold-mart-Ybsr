import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Marketplace terms | GoldMart" };
export default function TermsPage() {
  return <main className="min-h-screen bg-[#111514] px-5 py-12 text-[#F5F3EC]"><article className="mx-auto max-w-3xl space-y-6 leading-7">
    <Link href="/help" className="text-[#DCC38E]">← Help centre</Link>
    <h1 className="text-3xl font-bold">GoldMart marketplace terms</h1>
    <p className="text-[#C4C7BE]">Pre-launch draft · 26 October 2026. Not final legal terms for live commercial use.</p>
    <section><h2 className="text-xl font-semibold">Marketplace role</h2><p>GoldMart is being developed to connect buyers and independent sellers. Sellers are responsible for accurate product descriptions and lawful listings. GoldMart may review or remove suspicious listings and accounts.</p></section>
    <section><h2 className="text-xl font-semibold">Payments and payouts</h2><p>GoldMart currently supports payment testing only. Test checkout does not constitute a live sale. Live payment collection, seller transfers and provider refunds will remain unavailable until the business and payment systems are approved and enabled.</p></section>
    <section><h2 className="text-xl font-semibold">Orders, delivery and disputes</h2><p>Delivery fees, delivery providers and estimated delivery times are not yet finalized. Do not rely on a shipping promise that has not been confirmed for your order. Buyers can raise order, cancellation and refund concerns through <Link href="/orders" className="text-[#DCC38E] underline">My Orders</Link> and <Link href="/support" className="text-[#DCC38E] underline">Support</Link>. Approval of a refund request does not itself mean money has been returned.</p></section>
    <section><h2 className="text-xl font-semibold">Before public launch</h2><p>The registered operator's details, applicable law, seller obligations, delivery arrangements, consumer rights, returns procedures and contact information require final legal and operational review. Nothing here removes rights customers have under applicable law.</p></section>
  </article></main>;
}
