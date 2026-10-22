import Link from "next/link";

const categories = [
  { name: "Phones", icon: "📱", description: "Smartphones & accessories", shade: "from-[#F5E5CF] to-[#FCF8F0]" },
  { name: "Electronics", icon: "💻", description: "Devices for daily life", shade: "from-[#E4EAF0] to-[#F9FAFC]" },
  { name: "Gaming", icon: "🎮", description: "Consoles & accessories", shade: "from-[#E8E5F2] to-[#F9F7FD]" },
  { name: "Fashion", icon: "👕", description: "Looks you'll love", shade: "from-[#F4E6DF] to-[#FCF9F6]" },
  { name: "Beauty & Cosmetics", icon: "💄", description: "Beauty essentials", shade: "from-[#F6E1E9] to-[#FFF9FB]" },
  { name: "Groceries", icon: "🛒", description: "Everyday supplies", shade: "from-[#E4EFE4] to-[#FAFCF7]" },
  { name: "Home & Kitchen", icon: "🏠", description: "Refresh your space", shade: "from-[#F3EBD7] to-[#FCFAF5]" },
  { name: "Jewelry & Accessories", icon: "💎", description: "The finishing touch", shade: "from-[#E5EAF2] to-[#FBFCFD]" },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-32 text-[#17191D] md:pb-14">
      <div className="border-b border-[#EEE6DB] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-[23px] font-black tracking-[-0.05em]">Gold<span className="text-[#B08A50]">Mart</span></Link>
          <Link href="/shop" className="rounded-full border border-[#E4D8C5] px-4 py-2 text-xs font-bold hover:bg-[#F9F4EB]">Browse all products →</Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
        <section className="relative overflow-hidden rounded-[28px] bg-[#17191D] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full border-[35px] border-[#C5A46D]/10" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#E5CB9D]">Explore GoldMart</p>
          <h1 className="relative mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">Find exactly what you're looking for.</h1>
          <p className="relative mt-4 max-w-lg text-sm leading-6 text-[#E0DBD1]">Choose a department to see relevant products, or browse the entire marketplace.</p>
          <Link href="/shop" className="relative mt-6 inline-flex rounded-full bg-[#C5A46D] px-5 py-3 text-sm font-extrabold text-[#17191D] transition hover:bg-[#E9D9BB]">Explore all products ↗</Link>
        </section>
        <div className="mb-5 mt-9 flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#96713D]">Shop your way</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Departments</h2></div>
          <p className="text-xs font-semibold text-[#74716B]">{categories.length} categories</p>
        </div>
        <section aria-label="Shopping departments" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.name} href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-[23px] border border-[#E8E1D5] bg-white shadow-[0_5px_20px_rgba(23,25,29,0.035)] transition duration-200 hover:-translate-y-1 hover:border-[#C5A46D] hover:shadow-lg">
              <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${category.shade} sm:h-40`} aria-hidden="true">
                <span className="text-5xl transition duration-200 group-hover:scale-110 sm:text-6xl">{category.icon}</span>
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="text-sm font-black sm:text-base">{category.name}</h3>
                <p className="mt-1 min-h-9 text-xs leading-4 text-[#79736B]">{category.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-[#F0ECE4] pt-3 text-xs font-bold text-[#96713D]"><span>Explore</span><span aria-hidden="true">↗</span></div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
