import Navbar from "@/components/store/layout/Navbar";
// import CollectionSlider from "@/components/store/home/CollectionSlider";
// import HeroSection from "@/components/store/home/HeroSection";
// import FlashSaleSection from "@/components/store/home/FlashSaleSection";
// import DealsOfTheMonth from "@/components/store/home/DealsOfTheMonth";
// import NewArrivals from "@/components/store/home/NewArrivals";
// import FeaturedBanner from "@/components/store/home/FeaturedBanner";
// import InstagramSection from "@/components/store/home/InstagramSection";
import Newsletter from "@/components/store/layout/Newsletter";
import Footer from "@/components/store/layout/Footer";
import IntegratedCollectionSlider from "@/components/store/home/IntegratedCollectionSlider";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  return (
    <ScrollArea className="h-screen w-full" scrollBarClassName="hidden">
      <div className="min-h-screen bg-white font-montserrat overflow-x-hidden no-scrollbar">
        {/* <Navbar /> */}
        <IntegratedCollectionSlider />


        {/* Old Home Sections - Preservation as requested */}
        {/* 
        <HeroSection />
        <FlashSaleSection />
        <DealsOfTheMonth />
        <NewArrivals />
        <FeaturedBanner />
        <InstagramSection /> 
        */}

        {/* <Newsletter /> */}
        <Footer />
      </div>
    </ScrollArea>
  );
}
