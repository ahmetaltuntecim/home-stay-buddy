import Navbar from "@/components/Navbar";

import FeaturedStays from "@/components/FeaturedStays";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="light" />
      
      <FeaturedStays />
    </div>
  );
};

export default Index;
