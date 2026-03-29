import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ArrowLeft, Users, PlusCircle, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import UserManagement from "@/components/admin/UserManagement";
import HouseManagement from "@/components/admin/HouseManagement";
import BookingManagement from "@/components/admin/BookingManagement";
import Navbar from "@/components/Navbar";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border">
        <Navbar variant="light" />
        <div className="h-20" />
      </div>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 overflow-y-hidden">
            <TabsTrigger value="bookings" className="gap-2 font-body">
              <CalendarCheck className="w-4 h-4" />
              Takvim & Rezervasyonlar
            </TabsTrigger>
            <TabsTrigger value="houses" className="gap-2 font-body">
              <PlusCircle className="w-4 h-4" />
              Evler
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 font-body">
              <Users className="w-4 h-4" />
              Kullanıcılar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings"><BookingManagement /></TabsContent>
          <TabsContent value="houses"><HouseManagement /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
