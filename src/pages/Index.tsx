import Navbar from "@/components/Navbar";
import FeaturedStays from "@/components/FeaturedStays";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Index = () => {
  const { user, profile, loading } = useAuth();

  const handleSignIn = async () => {
    await lovable.auth.signInWithOAuth("google");
  };

  // Not logged in → show login screen
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <img src={logo} className="w-16 h-16 rounded-full object-cover shadow-xl border-2 border-primary/20" alt="TatilRezervasyonum" />
            <span className="font-display text-3xl font-bold">TatilRezervasyonum</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Hoş Geldiniz
          </h1>
          <p className="font-body text-muted-foreground">
            Evleri görmek ve rezervasyon yapmak için lütfen giriş yapın.
          </p>
          <Button size="lg" className="w-full font-body gap-2" onClick={handleSignIn}>
            Google ile Giriş Yap
          </Button>
        </div>
      </div>
    );
  }

  // Logged in but not approved → PendingApproval is already handled in App.tsx
  // Logged in and approved → show houses
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="light" />
      <FeaturedStays />
    </div>
  );
};

export default Index;
