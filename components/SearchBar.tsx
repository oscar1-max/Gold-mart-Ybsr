export default function SearchBar() {
  return (
    <div className="mx-auto my-10 max-w-3xl px-6">
      <div className="flex rounded-xl border bg-white shadow">
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 rounded-l-xl px-4 py-3 outline-none"
        />
        <button className="rounded-r-xl bg-yellow-600 px-6 py-3 font-semibold text-white hover:bg-black">
          Search
        </button>
      </div>
    </div>
  );
}
