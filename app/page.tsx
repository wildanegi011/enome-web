import Navbar from "@/components/store/Navbar";
import HeroSection from "@/components/store/HeroSection";
import FlashSaleSection from "@/components/store/FlashSaleSection";
import DealsOfTheMonth from "@/components/store/DealsOfTheMonth";
import NewArrivals from "@/components/store/NewArrivals";
import FeaturedBanner from "@/components/store/FeaturedBanner";
import InstagramSection from "@/components/store/InstagramSection";
import Newsletter from "@/components/store/Newsletter";
import Footer from "@/components/store/Footer";

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
