import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

type BookingStatus = "pending" | "confirmed" | "rejected";

interface Booking {
  id: string;
  house_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  created_at: string;
  house_title?: string;
  user_name?: string;
}

const statusLabels: Record<BookingStatus, string> = { pending: "Bekliyor", confirmed: "Onaylandı", rejected: "Reddedildi" };
const statusColors: Record<BookingStatus, string> = { pending: "bg-muted text-muted-foreground", confirmed: "bg-primary/15 text-primary", rejected: "bg-destructive/15 text-destructive" };

const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    // Fetch bookings
    const { data: bData } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (!bData) { setLoading(false); return; }

    // Fetch house titles and user names
    const houseIds = [...new Set(bData.map((b: any) => b.house_id))];
    const userIds = [...new Set(bData.map((b: any) => b.user_id))];

    const { data: houses } = await supabase.from("houses").select("id, title").in("id", houseIds);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);

    const houseMap = new Map(houses?.map((h: any) => [h.id, h.title]) || []);
    const userMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) || []);

    setBookings(bData.map((b: any) => ({
      ...b,
      house_title: houseMap.get(b.house_id) || "—",
      user_name: userMap.get(b.user_id) || "—",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error("Güncellenemedi: " + error.message);
    } else {
      toast.success("Durum güncellendi");
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    }
  };

  if (loading) return <p className="font-body text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">Ev</TableHead>
            <TableHead className="font-body">Kullanıcı</TableHead>
            <TableHead className="font-body">Tarih</TableHead>
            <TableHead className="font-body">Durum</TableHead>
            <TableHead className="font-body text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-body font-medium">{b.house_title}</TableCell>
              <TableCell className="font-body text-muted-foreground">{b.user_name}</TableCell>
              <TableCell className="font-body text-xs">
                {format(new Date(b.start_date), "dd/MM/yy")} – {format(new Date(b.end_date), "dd/MM/yy")}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn(statusColors[b.status], "font-body text-xs")}>
                  {statusLabels[b.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v as BookingStatus)}>
                  <SelectTrigger className="w-32 ml-auto font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="confirmed">Onayla</SelectItem>
                    <SelectItem value="rejected">Reddet</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {bookings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center font-body text-muted-foreground py-8">
                Henüz rezervasyon yok
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// cn helper used locally
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default BookingManagement;
