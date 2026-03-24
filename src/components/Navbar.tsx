import { Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-primary-foreground">
          <Home className="w-6 h-6" />
          <span className="font-display text-xl font-bold">HomeStay</span>
        </a>

        <div className="hidden md:flex items-center gap-8 font-body text-sm font-medium text-primary-foreground/80">
          <a href="#" className="hover:text-primary-foreground transition-colors">Explore</a>
          <a href="#" className="hover:text-primary-foreground transition-colors">Experiences</a>
          <a href="#" className="hover:text-primary-foreground transition-colors">About</a>
          <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body">
            Sign In
          </Button>
        </div>

        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-t border-border p-4 space-y-3 font-body">
          <a href="#" className="block py-2 text-foreground">Explore</a>
          <a href="#" className="block py-2 text-foreground">Experiences</a>
          <a href="#" className="block py-2 text-foreground">About</a>
          <Button className="w-full">Sign In</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
