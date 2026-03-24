import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedStays from "@/components/FeaturedStays";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturedStays />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
