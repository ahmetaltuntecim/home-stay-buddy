import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedStays from "@/components/FeaturedStays";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturedStays />
    </div>
  );
};

export default Index;
