import heroImage from "@/assets/hero-homestay.jpg";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Beautiful countryside cottage at golden hour"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-foreground/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6 animate-fade-up">
          Find Your Perfect
          <br />
          <span className="italic">Home Stay</span>
        </h1>
        <p className="font-body text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          Discover unique homes in extraordinary places. From mountain cabins to beachfront villas — your next adventure starts here.
        </p>

        {/* Search bar */}
        <div
          className="max-w-4xl mx-auto bg-card/95 backdrop-blur-md rounded-2xl p-3 shadow-elevated animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <input
                type="text"
                placeholder="Where to?"
                className="bg-transparent w-full font-body text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background">
              <Calendar className="w-5 h-5 text-accent shrink-0" />
              <input
                type="text"
                placeholder="Check in"
                className="bg-transparent w-full font-body text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background">
              <Users className="w-5 h-5 text-accent shrink-0" />
              <input
                type="text"
                placeholder="Guests"
                className="bg-transparent w-full font-body text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <Button className="h-full rounded-xl text-base font-body font-semibold gap-2">
              <Search className="w-5 h-5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
