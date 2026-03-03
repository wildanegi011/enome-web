import Navbar from "@/components/store/layout/Navbar";
import HeroSection from "@/components/store/home/HeroSection";
import FlashSaleSection from "@/components/store/home/FlashSaleSection";
import DealsOfTheMonth from "@/components/store/home/DealsOfTheMonth";
import NewArrivals from "@/components/store/home/NewArrivals";
import FeaturedBanner from "@/components/store/home/FeaturedBanner";
import InstagramSection from "@/components/store/home/InstagramSection";
import Newsletter from "@/components/store/layout/Newsletter";
import Footer from "@/components/store/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <HeroSection />
      <FlashSaleSection />
      <DealsOfTheMonth />
      <NewArrivals />
      <FeaturedBanner />
      <InstagramSection />
      <Newsletter />
      <Footer />
    </div>
  );
}
