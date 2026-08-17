"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const query = search.trim();

    if (!query) {
      router.push("/shop");
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mx-auto my-10 max-w-3xl px-6">
      <div className="flex overflow-hidden rounded-xl border bg-white shadow">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          className="flex-1 rounded-l-xl px-4 py-3 outline-none"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="rounded-r-xl bg-yellow-600 px-6 py-3 font-semibold text-white transition hover:bg-black"
        >
          Search
        </button>
      </div>
    </div>
  );
}
