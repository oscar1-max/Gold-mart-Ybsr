import Image from "next/image";

type ProductCardProps = {
  name: string;
  price: string | number;
  currency?: string | null;
  rating: number;
  image: string;
};

export default function ProductCard({
  name,
  price,
  currency,
  rating,
  image,
}: ProductCardProps) {
  function formatPrice() {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "0.00";
    }

    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    switch (currency?.toUpperCase()) {
      case "USD":
        return `$${formatted}`;

      case "EUR":
        return `€${formatted}`;

      case "GBP":
        return `£${formatted}`;

      case "NGN":
        return `₦${formatted}`;

      default:
        return formatted;
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-xl">
      <div className="relative h-52 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold">{name}</h3>

        <p className="mt-2 font-bold text-yellow-600">
          {formatPrice()}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          ⭐ {rating.toFixed(1)} / 5
        </p>

        <button className="mt-5 w-full rounded-lg bg-black py-2 text-white transition hover:bg-yellow-600">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
