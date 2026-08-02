import Navbar from "@/components/Navbar";
import PromoBanner from "@/components/PromoBanner";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <PromoBanner />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Footer />
    </>
  );
}
