import { Home, Menu, X, LogOut, Shield, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { lovable } from "@/integrations/lovable";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { hasAdminAccess } = useUserRole();

  const handleSignIn = async () => {
    await lovable.auth.signInWithOAuth("google");
  };

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

          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                {hasAdminAccess && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body gap-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/my-bookings">
                  <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    Rezervasyonlarım
                  </Button>
                </Link>
                <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    {(profile?.display_name || user.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body gap-2"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body"
                onClick={handleSignIn}
              >
                Google ile Giriş
              </Button>
            )
          )}
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
          {!loading && (
            user ? (
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {(profile?.display_name || user.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button className="flex-1 gap-2" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleSignIn}>
                Google ile Giriş
              </Button>
            )
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
