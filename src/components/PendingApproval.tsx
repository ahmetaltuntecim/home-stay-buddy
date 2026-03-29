import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const PendingApproval = () => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-4">
        <div className="mx-auto flex flex-col items-center gap-4">
          <img src={logo} className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-primary/10" alt="TatilRezervasyonum" />
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center -mt-8 ml-8 border-2 border-card">
            <Clock className="w-5 h-5 text-accent" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Onay Bekliyor</h1>
        <p className="font-body text-muted-foreground">
          Hesabınız yönetici onayı beklemektedir. Onaylandıktan sonra siteyi kullanabileceksiniz.
        </p>
        {profile?.display_name && (
          <p className="font-body text-sm text-foreground/70">
            Hoş geldiniz, <span className="font-semibold">{profile.display_name}</span>
          </p>
        )}
        <Button variant="outline" className="font-body gap-2" onClick={signOut}>
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
