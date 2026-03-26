import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PendingApproval = () => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-accent" />
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
