export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 mt-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold text-yellow-500">
              GoldMart
            </h2>
            <p className="mt-2 text-gray-400">
              Your trusted online marketplace.
            </p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="hover:text-yellow-500">
              Home
            </a>
            <a href="#" className="hover:text-yellow-500">
              Shop
            </a>
            <a href="#" className="hover:text-yellow-500">
              Sellers
            </a>
            <a href="#" className="hover:text-yellow-500">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          © 2026 GoldMart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
