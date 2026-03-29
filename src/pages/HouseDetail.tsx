import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, MapPin, Users, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import stayMountain from "@/assets/stay-mountain.jpg";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface BookedDateInfo {
  date: Date;
  userName: string;
  status: string;
}

const HouseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { hasAdminAccess } = useUserRole();
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [bookedDatesInfo, setBookedDatesInfo] = useState<BookedDateInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchHouse = async () => {
      // Fetch public data from the view (accessible to everyone)
      const { data } = await (supabase.from as any)("houses_public").select("*").eq("id", id).single();
      if (data) {
        setHouse(data);
        // Fetch private details via RPC (only returns data for authorized users)
        const { data: privateData } = await supabase.rpc("get_house_private_details", { p_house_id: id });
        if (privateData && privateData.length > 0) {
          setHouse((prev: any) => ({
            ...prev,
            private_description: privateData[0].private_description,
            latitude: privateData[0].latitude,
            longitude: privateData[0].longitude,
          }));
          setHasConfirmedBooking(true);
        }
      }
      setLoading(false);
    };

    const fetchBookedDates = async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_date, end_date, user_id, status")
        .eq("house_id", id)
        .in("status", ["confirmed", "pending"]);

      if (!bookings || bookings.length === 0) return;

      if (user) {
        const userConfirmed = bookings.some(
          (b: any) => b.user_id === user.id && b.status === "confirmed"
        );
        if (userConfirmed) setHasConfirmedBooking(true);
      }

      const userIds = [...new Set(bookings.map((b: any) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const userMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name || "Misafir"]) || []);

      const infos: BookedDateInfo[] = [];
      bookings.forEach((b: any) => {
        const days = eachDayOfInterval({ start: parseISO(b.start_date), end: parseISO(b.end_date) });
        const name = b.user_id === "00000000-0000-0000-0000-000000000000"
          ? "Kapalı"
          : (userMap.get(b.user_id) || "Misafir");
        days.forEach((d) => infos.push({ date: d, userName: name, status: b.status }));
      });
      setBookedDatesInfo(infos);
    };

    fetchHouse();
    fetchBookedDates();
  }, [id, user]);

  // canSeePrivate is true if RPC returned private data (meaning user is admin/mod or has confirmed booking)
  const canSeePrivate = hasAdminAccess || hasConfirmedBooking;

  const getDateInfo = (date: Date) => {
    return bookedDatesInfo.find((bi) => bi.date.toDateString() === date.toDateString());
  };

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (house?.available_from && date < parseISO(house.available_from)) return true;
    if (house?.available_to && date > parseISO(house.available_to)) return true;
    const info = getDateInfo(date);
    return info?.status === "confirmed";
  };

  const handleBooking = async () => {
    if (!user) { toast.error("Rezervasyon için giriş yapmalısınız"); return; }
    if (!startDate || !endDate) { toast.error("Başlangıç ve bitiş tarihi seçin"); return; }
    if (endDate <= startDate) { toast.error("Bitiş tarihi başlangıçtan sonra olmalıdır"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      house_id: id,
      user_id: user.id,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    });
    setSubmitting(false);

    if (error) {
      toast.error("Rezervasyon gönderilemedi: " + error.message);
    } else {
      toast.success("Rezervasyon talebiniz gönderildi!");
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-body text-muted-foreground">Ev bulunamadı</p>
        <Link to="/"><Button variant="outline">Ana Sayfaya Dön</Button></Link>
      </div>
    );
  }

  const nightCount = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasCoords = house.latitude && house.longitude;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary">
        <Navbar />
        <div className="h-16" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden aspect-video">
              <img src={house.image_url || stayMountain} alt={house.title} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display text-3xl font-bold text-foreground">{house.title}</h1>
                {Number(house.rating) > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span className="font-body font-semibold">{house.rating}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 font-body text-sm text-muted-foreground mb-4">
                {house.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {house.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {house.capacity} kişi</span>
                {house.tag && <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">{house.tag}</span>}
              </div>

              {house.description && <p className="font-body text-foreground/80 leading-relaxed">{house.description}</p>}

              {house.available_from && house.available_to && (
                <p className="font-body text-sm text-muted-foreground mt-4">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Müsait: {format(parseISO(house.available_from), "dd/MM/yyyy")} – {format(parseISO(house.available_to), "dd/MM/yyyy")}
                </p>
              )}
            </div>

            {/* Private description - only for confirmed users or admin/mod */}
            {canSeePrivate && house.private_description && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-accent" />
                  Detaylı Bilgiler
                </h3>
                <p className="font-body text-foreground/80 leading-relaxed whitespace-pre-wrap">{house.private_description}</p>
              </div>
            )}

            {!canSeePrivate && house.private_description && (
              <div className="bg-muted/50 rounded-xl border border-border p-6 text-center">
                <Lock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="font-body text-sm text-muted-foreground">
                  Detaylı bilgiler sadece onaylanmış rezervasyonu olan üyeler tarafından görülebilir.
                </p>
              </div>
            )}

            {/* Map - only for confirmed users or admin/mod */}
            {canSeePrivate && hasCoords && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Konum
                </h3>
                <div className="rounded-xl overflow-hidden h-[300px] md:h-[400px] touch-pan-y">
                  <MapContainer
                    center={[Number(house.latitude), Number(house.longitude)]}
                    zoom={13}
                    scrollWheelZoom={false}
                    dragging={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[Number(house.latitude), Number(house.longitude)]}>
                      <Popup>{house.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {!canSeePrivate && hasCoords && (
              <div className="bg-muted/50 rounded-xl border border-border p-6 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="font-body text-sm text-muted-foreground">
                  Harita bilgisi sadece onaylanmış rezervasyonu olan üyeler tarafından görülebilir.
                </p>
              </div>
            )}

          </div>

          {/* Right: Booking Card - only for logged-in users */}
          {user && <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-8 space-y-5">
              <div className="font-body">
                <span className="text-2xl font-bold text-foreground">₺{Number(house.price).toLocaleString()}</span>
                <span className="text-muted-foreground"> / gece</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-2 font-body text-xs">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/70" /> Dolu</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400" /> Bekliyor</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border" /> Boş</div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="font-body text-sm font-medium text-foreground">Giriş Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Tarih seç"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={isDateDisabled}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        modifiers={{
                          confirmed: bookedDatesInfo.filter(d => d.status === "confirmed").map(d => d.date),
                          pending: bookedDatesInfo.filter(d => d.status === "pending").map(d => d.date),
                        }}
                        modifiersClassNames={{
                          confirmed: "bg-destructive/20 text-destructive",
                          pending: "bg-yellow-100 text-yellow-800",
                        }}
                        components={{
                          DayContent: ({ date }) => {
                            const info = getDateInfo(date);
                            return (
                              <div className="flex flex-col items-center">
                                <span>{date.getDate()}</span>
                                {info && (
                                  <span className="text-[8px] leading-tight truncate max-w-[3rem]">
                                    {info.userName}
                                  </span>
                                )}
                              </div>
                            );
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="font-body text-sm font-medium text-foreground">Çıkış Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Tarih seç"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => isDateDisabled(date) || (startDate ? date <= startDate : false)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        modifiers={{
                          confirmed: bookedDatesInfo.filter(d => d.status === "confirmed").map(d => d.date),
                          pending: bookedDatesInfo.filter(d => d.status === "pending").map(d => d.date),
                        }}
                        modifiersClassNames={{
                          confirmed: "bg-destructive/20 text-destructive",
                          pending: "bg-yellow-100 text-yellow-800",
                        }}
                        components={{
                          DayContent: ({ date }) => {
                            const info = getDateInfo(date);
                            return (
                              <div className="flex flex-col items-center">
                                <span>{date.getDate()}</span>
                                {info && (
                                  <span className="text-[8px] leading-tight truncate max-w-[3rem]">
                                    {info.userName}
                                  </span>
                                )}
                              </div>
                            );
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {nightCount > 0 && (
                <div className="border-t border-border pt-4 space-y-2 font-body text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">₺{Number(house.price).toLocaleString()} × {nightCount} gece</span>
                    <span className="font-medium">₺{(Number(house.price) * nightCount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>Toplam</span>
                    <span>₺{(Number(house.price) * nightCount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button className="w-full font-body" disabled={submitting || !startDate || !endDate} onClick={handleBooking}>
                {submitting ? "Gönderiliyor..." : "Rezervasyon Talep Et"}
              </Button>

            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default HouseDetail;
