export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <h1 className="text-3xl font-bold text-yellow-600">
          GoldMart
        </h1>

        {/* Navigation Links */}
        <div className="hidden gap-8 md:flex">
          <a href="#" className="font-medium hover:text-yellow-600">
            Home
          </a>

          <a href="#" className="font-medium hover:text-yellow-600">
            Shop
          </a>

          <a href="#" className="font-medium hover:text-yellow-600">
            Categories
          </a>

          <a href="#" className="font-medium hover:text-yellow-600">
            Sellers
          </a>

          <a href="#" className="font-medium hover:text-yellow-600">
            Contact
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="rounded-full border px-4 py-2 hover:bg-gray-100">
            ❤️ Wishlist
          </button>

          <button className="rounded-full border px-4 py-2 hover:bg-gray-100">
            🛒 Cart
          </button>

          <button className="rounded-full bg-black px-5 py-2 text-white hover:bg-yellow-600">
            👤 Account
          </button>
        </div>
      </div>
    </nav>
  );
}
