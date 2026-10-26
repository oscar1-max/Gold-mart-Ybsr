import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy notice | GoldMart", description: "How GoldMart uses account and marketplace information." };
export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#111514] px-5 py-12 text-[#F5F3EC]"><article className="mx-auto max-w-3xl space-y-6 leading-7">
    <Link href="/help" className="text-[#DCC38E]">← Help centre</Link>
    <h1 className="text-3xl font-bold">GoldMart privacy notice</h1>
    <p className="text-sm text-[#C4C7BE]">Pre-launch information notice · 26 October 2026. The final policy must be reviewed and completed before accepting live customers.</p>
    <section><h2 className="text-xl font-semibold">Information used to operate GoldMart</h2><p>GoldMart's account and marketplace features use details you provide, such as your name, email, delivery contact details, product listings, orders, messages, support requests and transaction references. Payment details entered on the Paystack payment page are handled through Paystack; GoldMart's backend handles payment references and verification results.</p></section>
    <section><h2 className="text-xl font-semibold">Why information is used</h2><p>To operate accounts, connect buyers and sellers, process test orders, prevent fraud, handle delivery questions, disputes, customer support and required record keeping. Some data is shared with sellers involved in an order and service providers needed to operate the marketplace, including hosting, product-image storage and payment processing.</p></section>
    <section><h2 className="text-xl font-semibold">Your choices and requests</h2><p>You can ask about access, corrections or deletion of your account information through <Link className="text-[#DCC38E] underline" href="/account-deletion">account deletion requests</Link> or <Link className="text-[#DCC38E] underline" href="/support">customer support</Link>. Some order, fraud-prevention, dispute or legal records may need to be retained. A request is not an immediate automated deletion.</p></section>
    <section><h2 className="text-xl font-semibold">Security and retention</h2><p>GoldMart uses account authentication and server-side access checks. No online service can promise absolute security. Retention periods and the identity and contact information of the final registered business operator must be confirmed before public launch.</p></section>
    <section><h2 className="text-xl font-semibold">Contact</h2><p>Signed-in customers can contact GoldMart through the <Link href="/support" className="text-[#DCC38E] underline">support ticket system</Link>. A public privacy contact address will be added before launch.</p></section>
  </article></main>;
}
