import { Home, Menu, X, LogOut, Shield, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

const Navbar = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const [open, setOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { hasAdminAccess } = useUserRole();
  const isDark = variant === "dark";
  const textClass = isDark ? "text-primary-foreground" : "text-foreground";
  const textMutedClass = isDark ? "text-primary-foreground/80" : "text-muted-foreground";
  const borderClass = isDark ? "border-primary-foreground/30" : "border-border";
  const hoverBgClass = isDark ? "hover:bg-primary-foreground/10" : "hover:bg-muted";

  const handleSignIn = async () => {
    await lovable.auth.signInWithOAuth("google");
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-[100]">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between">
        <a href="/" className={cn("flex items-center gap-2", textClass)}>
          <Home className="w-6 h-6" />
          <span className="font-display text-xl font-bold">HomeStay</span>
        </a>

        <div className={cn("hidden md:flex items-center gap-8 font-body text-sm font-medium", textMutedClass)}>
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                {hasAdminAccess && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className={cn(borderClass, textClass, "bg-transparent", hoverBgClass, "font-body gap-2")}>
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/my-bookings">
                  <Button variant="outline" size="sm" className={cn(borderClass, textClass, "bg-transparent", hoverBgClass, "font-body gap-2")}>
                    <CalendarCheck className="w-4 h-4" />
                    Rezervasyonlarım
                  </Button>
                </Link>
                <Avatar className={cn("h-9 w-9 border-2", borderClass)}>
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    {(profile?.display_name || user.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(borderClass, textClass, "bg-transparent", hoverBgClass, "font-body gap-2")}
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className={cn(borderClass, textClass, "bg-transparent", hoverBgClass, "font-body")}
                onClick={handleSignIn}
              >
                Google ile Giriş
              </Button>
            )
          )}
        </div>

        <button className={cn("md:hidden", textClass)} onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-t border-border p-4 space-y-3 font-body">
          {!loading && (
            user ? (
              <div className="space-y-3">
                {hasAdminAccess && (
                  <Link to="/admin" className="block py-2 text-foreground" onClick={() => setOpen(false)}>
                    Admin Paneli
                  </Link>
                )}
                <Link to="/my-bookings" className="block py-2 text-foreground" onClick={() => setOpen(false)}>
                  Rezervasyonlarım
                </Link>
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
