import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Account deletion requests | GoldMart", description: "Request deletion of your GoldMart account and personal information." };
export default function AccountDeletionPage() {
  return <main className="min-h-screen bg-[#111514] px-5 py-12 text-[#F5F3EC]"><article className="mx-auto max-w-3xl space-y-6 leading-7">
    <Link href="/account" className="text-[#DCC38E]">← My account</Link>
    <h1 className="text-3xl font-bold">Request account deletion</h1>
    <p>You can ask GoldMart to delete your buyer or seller account and associated personal information. The request is handled manually; submitting a ticket does not delete your account immediately.</p>
    <h2 className="text-xl font-semibold">How to request deletion</h2>
    <ol className="list-decimal space-y-2 pl-6"><li>Sign in to the GoldMart account you want deleted.</li><li>Open <Link href="/support" className="text-[#DCC38E] underline">Customer Support</Link>.</li><li>Select <strong>Account help</strong> and use the subject <strong>Delete my GoldMart account</strong>.</li><li>In your message, write that you want your account and eligible personal data deleted. Do not include your password, banking credentials or identity-document numbers.</li><li>GoldMart support will review the request and any outstanding orders, refunds or seller obligations before confirming what can be deleted.</li></ol>
    <p>Some transaction, fraud-prevention, dispute and legally required records may need to be retained even after an account is closed. The operator's final retention schedule and a public contact method must be added before the Play Store submission.</p>
    <div className="flex flex-wrap gap-3"><Link href="/support" className="rounded-xl bg-[#C8AB6D] px-5 py-3 font-bold text-black">Open support</Link><Link href="/privacy" className="rounded-xl border border-[#6E6E60] px-5 py-3">Privacy notice</Link></div>
  </article></main>;
}
