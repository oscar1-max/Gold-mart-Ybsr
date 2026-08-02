import ProductCard from "@/components/ProductCard";

const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: "$89",
    rating: 4.8,
    image: "/images/headphones.jpg",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: "$149",
    rating: 4.7,
    image: "/images/watch.jpg",
  },
  {
    id: 3,
    name: "Gaming Mouse",
    price: "$59",
    rating: 4.9,
    image: "/images/mouse.jpg",
  },
  {
    id: 4,
    name: "Leather Backpack",
    price: "$99",
    rating: 4.6,
    image: "/images/backpack.jpg",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">
          Featured Products
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              rating={product.rating}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
