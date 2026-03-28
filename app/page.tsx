import Navbar from "@/components/store/layout/Navbar";
import Newsletter from "@/components/store/layout/Newsletter";
import Footer from "@/components/store/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import LazyIntegratedCollectionSlider from "@/components/store/home/LazyIntegratedCollectionSlider";

export default function Home() {
  return (
    <ScrollArea className="h-screen w-full" scrollBarClassName="hidden">
      <div className="min-h-screen bg-white font-montserrat overflow-x-hidden no-scrollbar">
        {/* <Navbar /> */}
        <LazyIntegratedCollectionSlider />
        
        {/* <Newsletter /> */}
        <Footer />
      </div>
    </ScrollArea>
  );
}


