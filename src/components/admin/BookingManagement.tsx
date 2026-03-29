import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight, Trash2, Pencil, Ban, Plus } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "rejected";

interface Booking {
  id: string;
  house_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  created_at: string;
  is_manual?: boolean;
  house_title?: string;
  user_name?: string;
}

const statusLabels: Record<BookingStatus, string> = { pending: "Bekliyor", confirmed: "Onaylandı", rejected: "Reddedildi" };
const statusColors: Record<BookingStatus, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-primary/15 text-primary", rejected: "bg-destructive/15 text-destructive" };

const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [manualMode, setManualMode] = useState<"block" | "manual-booking" | null>(null);
  const [manualStartDate, setManualStartDate] = useState<Date | undefined>();
  const [manualEndDate, setManualEndDate] = useState<Date | undefined>();
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Edit state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<Date | undefined>();
  const [editEnd, setEditEnd] = useState<Date | undefined>();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: bData }, { data: hData }, { data: profiles }] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("houses").select("id, title, available_from, available_to").order("title"),
      supabase.from("profiles").select("user_id, display_name"),
    ]);

    if (hData) setHouses(hData);
    if (!bData) { setLoading(false); return; }

    const houseMap = new Map(hData?.map((h: any) => [h.id, h.title]) || []);
    const userMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) || []);

    setBookings(bData.map((b: any) => ({
      ...b,
      house_title: houseMap.get(b.house_id) || "—",
      user_name: userMap.get(b.user_id) || "—",
    })));

    if (!selectedHouseId && hData && hData.length > 0) {
      setSelectedHouseId(hData[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error("Güncellenemedi: " + error.message);
    } else {
      toast.success("Durum güncellendi");
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    }
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error("Silinemedi: " + error.message);
    } else {
      toast.success("Rezervasyon silindi");
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const saveEditDates = async (id: string) => {
    if (!editStart || !editEnd) return;
    const { error } = await supabase.from("bookings").update({
      start_date: format(editStart, "yyyy-MM-dd"),
      end_date: format(editEnd, "yyyy-MM-dd"),
    }).eq("id", id);
    if (error) {
      toast.error("Tarih güncellenemedi: " + error.message);
    } else {
      toast.success("Tarihler güncellendi");
      setEditingBookingId(null);
      fetchData();
    }
  };

  // Calendar logic
  const houseBookings = useMemo(() =>
    bookings.filter((b) => b.house_id === selectedHouseId && b.status !== "rejected"),
    [bookings, selectedHouseId]
  );

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayInfo = (day: Date) => {
    for (const b of houseBookings) {
      const s = parseISO(b.start_date);
      const e = parseISO(b.end_date);
      if (day >= s && day <= e) {
        return { booking: b, status: b.status as BookingStatus };
      }
    }
    return null;
  };

  const handleBlockDates = async () => {
    if (!manualStartDate || !manualEndDate || !selectedHouseId) {
      toast.error("Başlangıç ve bitiş tarihi seçin");
      return;
    }
    
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = {
      house_id: selectedHouseId,
      user_id: user?.id || null, // Current user's ID
      is_manual: true,
      start_date: format(manualStartDate, "yyyy-MM-dd"),
      end_date: format(manualEndDate, "yyyy-MM-dd"),
      status: "confirmed" as const,
    };

    console.log("Blocking dates payload:", payload);

    const { error, data } = await supabase.from("bookings").insert(payload).select();
    
    if (error) {
      console.error("Booking error details:", error);
      toast.error("Tarihler kapatılamadı: " + error.message);
    } else {
      console.log("Booking success:", data);
      toast.success("Tarihler kapatıldı");
      setManualStartDate(undefined);
      setManualEndDate(undefined);
      setManualMode(null);
      fetchData();
    }
  };

  const handleManualBooking = async () => {
    if (!manualStartDate || !manualEndDate || !selectedHouseId) {
      toast.error("Başlangıç ve bitiş tarihi seçin");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("bookings").insert({
      house_id: selectedHouseId,
      user_id: user?.id || null,
      is_manual: true,
      start_date: format(manualStartDate, "yyyy-MM-dd"),
      end_date: format(manualEndDate, "yyyy-MM-dd"),
      status: "confirmed" as const,
    });
    
    if (error) {
      toast.error("Rezervasyon eklenemedi: " + error.message);
    } else {
      toast.success("Manuel rezervasyon eklendi");
      setManualStartDate(undefined);
      setManualEndDate(undefined);
      setManualMode(null);
      fetchData();
    }
  };

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  if (loading) return <p className="font-body text-muted-foreground">Yükleniyor...</p>;

  const filteredBookings = selectedHouseId
    ? bookings.filter((b) => b.house_id === selectedHouseId)
    : bookings;

  return (
    <div className="space-y-8">
      {/* House selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <label className="font-body text-sm font-medium text-foreground">Ev Seç</label>
          <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
            <SelectTrigger className="w-64 font-body">
              <SelectValue placeholder="Ev seçin" />
            </SelectTrigger>
            <SelectContent>
              {houses.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visual Calendar */}
      {selectedHouseId && (
        <div 
          className="bg-card rounded-xl border border-border p-6"
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const touchEnd = e.changedTouches[0].clientX;
            const distance = touchStart - touchEnd;
            const minSwipeDistance = 50;
            if (distance > minSwipeDistance) setCurrentMonth(addMonths(currentMonth, 1));
            else if (distance < -minSwipeDistance) setCurrentMonth(subMonths(currentMonth, 1));
            setTouchStart(null);
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="font-display text-xl font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 font-body text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/70" /> Dolu (Onaylı)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400" /> Bekliyor</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border" /> Boş</div>
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center font-body text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthDays.map((day) => {
              const info = getDayInfo(day);
              const isConfirmed = info?.status === "confirmed";
              const isPending = info?.status === "pending";
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-body transition-colors cursor-default",
                    isConfirmed && "bg-destructive/20 text-destructive",
                    isPending && "bg-yellow-100 text-yellow-800",
                    !info && "bg-background hover:bg-muted border border-border/50"
                  )}
                  title={info ? `${info.booking.user_name} (${statusLabels[info.status]})` : "Boş"}
                >
                  <span className="font-semibold">{format(day, "d")}</span>
                  {info && (
                    <span className="text-[9px] truncate max-w-full px-0.5 leading-tight">
                      {info.booking.is_manual ? "Bakım" : (info.booking.user_name || "Misafir")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Manual actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant={manualMode === "block" ? "default" : "outline"}
              size="sm"
              className="font-body gap-2"
              onClick={() => setManualMode(manualMode === "block" ? null : "block")}
            >
              <Ban className="w-4 h-4" />
              Tarihleri Kapat
            </Button>
            <Button
              variant={manualMode === "manual-booking" ? "default" : "outline"}
              size="sm"
              className="font-body gap-2"
              onClick={() => setManualMode(manualMode === "manual-booking" ? null : "manual-booking")}
            >
              <Plus className="w-4 h-4" />
              Manuel Rezervasyon
            </Button>
          </div>

          {manualMode && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <p className="font-body text-sm font-medium text-foreground">
                {manualMode === "block" ? "Kapatılacak tarihleri seçin" : "Manuel rezervasyon tarihleri"}
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <label className="font-body text-xs text-muted-foreground">Başlangıç</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-36 justify-start font-normal", !manualStartDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {manualStartDate ? format(manualStartDate, "dd/MM/yyyy") : "Tarih seç"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={manualStartDate} onSelect={setManualStartDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="font-body text-xs text-muted-foreground">Bitiş</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-36 justify-start font-normal", !manualEndDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {manualEndDate ? format(manualEndDate, "dd/MM/yyyy") : "Tarih seç"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={manualEndDate} onSelect={setManualEndDate} disabled={(d) => manualStartDate ? d < manualStartDate : false} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  size="sm"
                  className="font-body"
                  onClick={manualMode === "block" ? handleBlockDates : handleManualBooking}
                  disabled={!manualStartDate || !manualEndDate}
                >
                  {manualMode === "block" ? "Kapat" : "Ekle"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
        <h3 className="font-display text-xl font-bold text-foreground p-6 pb-4">
          Rezervasyon Talepleri
        </h3>
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
            {filteredBookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-body font-medium">{b.house_title}</TableCell>
                <TableCell className="font-body text-muted-foreground">
                  {b.is_manual ? "Manuel / Bakım" : (b.user_name || "Misafir")}
                </TableCell>
                <TableCell className="font-body text-xs">
                  {editingBookingId === b.id ? (
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs w-28">
                            {editStart ? format(editStart, "dd/MM/yy") : "Başlangıç"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editStart} onSelect={setEditStart} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                      </Popover>
                      <span>–</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs w-28">
                            {editEnd ? format(editEnd, "dd/MM/yy") : "Bitiş"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editEnd} onSelect={setEditEnd} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                      </Popover>
                      <Button size="sm" className="text-xs" onClick={() => saveEditDates(b.id)}>Kaydet</Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingBookingId(null)}>İptal</Button>
                    </div>
                  ) : (
                    `${format(new Date(b.start_date), "dd/MM/yy")} – ${format(new Date(b.end_date), "dd/MM/yy")}`
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn(statusColors[b.status], "font-body text-xs")}>
                    {statusLabels[b.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v as BookingStatus)}>
                      <SelectTrigger className="w-28 font-body text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Bekliyor</SelectItem>
                        <SelectItem value="confirmed">Onayla</SelectItem>
                        <SelectItem value="rejected">Reddet</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingBookingId(b.id);
                      setEditStart(new Date(b.start_date));
                      setEditEnd(new Date(b.end_date));
                    }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteBooking(b.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center font-body text-muted-foreground py-8">
                  Henüz rezervasyon yok
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BookingManagement;
