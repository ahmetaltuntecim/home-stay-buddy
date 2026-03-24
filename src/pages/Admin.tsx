import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ArrowLeft, Users, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import UserManagement from "@/components/admin/UserManagement";
import HouseManagement from "@/components/admin/HouseManagement";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Paneli</h1>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2 font-body">
              <Users className="w-4 h-4" />
              Kullanıcı Yönetimi
            </TabsTrigger>
            <TabsTrigger value="houses" className="gap-2 font-body">
              <PlusCircle className="w-4 h-4" />
              Ev Yönetimi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="houses">
            <HouseManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
