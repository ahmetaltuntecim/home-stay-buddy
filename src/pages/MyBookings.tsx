import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

type BookingStatus = "pending" | "confirmed" | "rejected";
const statusLabels: Record<BookingStatus, string> = { pending: "Bekliyor", confirmed: "Onaylandı", rejected: "Reddedildi" };
const statusColors: Record<BookingStatus, string> = { pending: "bg-muted text-muted-foreground", confirmed: "bg-primary/15 text-primary", rejected: "bg-destructive/15 text-destructive" };

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const houseIds = [...new Set(data.map((b: any) => b.house_id))];
        const { data: houses } = await supabase.from("houses").select("id, title").in("id", houseIds);
        const houseMap = new Map(houses?.map((h: any) => [h.id, h.title]) || []);
        setBookings(data.map((b: any) => ({ ...b, house_title: houseMap.get(b.house_id) || "—" })));
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary">
        <Navbar />
        <div className="h-16" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfa
        </Link>

        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Rezervasyonlarım</h1>

        {!user ? (
          <p className="font-body text-muted-foreground">Rezervasyonlarınızı görmek için giriş yapın.</p>
        ) : loading ? (
          <p className="font-body text-muted-foreground">Yükleniyor...</p>
        ) : bookings.length === 0 ? (
          <p className="font-body text-muted-foreground">Henüz bir rezervasyon talebiniz yok.</p>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Ev</TableHead>
                  <TableHead className="font-body">Giriş</TableHead>
                  <TableHead className="font-body">Çıkış</TableHead>
                  <TableHead className="font-body">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-body font-medium">{b.house_title}</TableCell>
                    <TableCell className="font-body text-sm">{format(new Date(b.start_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-body text-sm">{format(new Date(b.end_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusColors[b.status as BookingStatus]} font-body text-xs`}>
                        {statusLabels[b.status as BookingStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
