import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Pencil, CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HouseForm {
  title: string;
  description: string;
  private_description: string;
  capacity: string;
  price: string;
  image_url: string;
  location: string;
  tag: string;
  latitude: string;
  longitude: string;
  available_from: Date | undefined;
  available_to: Date | undefined;
}

const emptyForm: HouseForm = {
  title: "", description: "", private_description: "", capacity: "2", price: "", image_url: "", location: "", tag: "",
  latitude: "", longitude: "",
  available_from: undefined, available_to: undefined,
};

const HouseManagement = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<HouseForm>(emptyForm);
  const [houses, setHouses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchHouses = async () => {
    const { data } = await supabase.from("houses").select("*").order("created_at", { ascending: false });
    if (data) setHouses(data);
  };

  useEffect(() => { fetchHouses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      toast.error("Başlık ve fiyat zorunludur");
      return;
    }

    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      private_description: form.private_description.trim() || null,
      capacity: parseInt(form.capacity) || 2,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      location: form.location.trim() || null,
      tag: form.tag.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      available_from: form.available_from ? format(form.available_from, "yyyy-MM-dd") : null,
      available_to: form.available_to ? format(form.available_to, "yyyy-MM-dd") : null,
    };

    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from("houses").update(payload).eq("id", editingId);
      setSubmitting(false);
      if (error) {
        toast.error("Güncellenemedi: " + error.message);
      } else {
        toast.success("Ev güncellendi!");
        setForm(emptyForm);
        setEditingId(null);
        fetchHouses();
      }
    } else {
      payload.created_by = user?.id;
      const { error } = await supabase.from("houses").insert(payload);
      setSubmitting(false);
      if (error) {
        toast.error("Ev eklenemedi: " + error.message);
      } else {
        toast.success("Ev başarıyla eklendi!");
        setForm(emptyForm);
        fetchHouses();
      }
    }
  };

  const startEdit = (h: any) => {
    setEditingId(h.id);
    setForm({
      title: h.title || "",
      description: h.description || "",
      private_description: h.private_description || "",
      capacity: String(h.capacity || 2),
      price: String(h.price || ""),
      image_url: h.image_url || "",
      location: h.location || "",
      tag: h.tag || "",
      latitude: h.latitude ? String(h.latitude) : "",
      longitude: h.longitude ? String(h.longitude) : "",
      available_from: h.available_from ? new Date(h.available_from) : undefined,
      available_to: h.available_to ? new Date(h.available_to) : undefined,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("houses").delete().eq("id", id);
    if (error) {
      toast.error("Silinemedi: " + error.message);
    } else {
      toast.success("Ev silindi");
      setHouses((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const update = (key: keyof HouseForm, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-foreground">
            {editingId ? "Ev Düzenle" : "Yeni Ev Ekle"}
          </h3>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="font-body gap-1">
              <X className="w-4 h-4" /> İptal
            </Button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-body">Başlık *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Dağ Evi" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Konum</Label>
            <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Bolu, Türkiye" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Fiyat (₺/gece) *</Label>
            <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="500" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Kapasite</Label>
            <Input type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="2" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Faaliyet Başlangıç Tarihi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.available_from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.available_from ? format(form.available_from, "dd/MM/yyyy") : "Tarih seç"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.available_from} onSelect={(d) => update("available_from", d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="font-body">Faaliyet Bitiş Tarihi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.available_to && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.available_to ? format(form.available_to, "dd/MM/yyyy") : "Tarih seç"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.available_to} onSelect={(d) => update("available_to", d)} disabled={(date) => form.available_from ? date < form.available_from : false} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="font-body">Görsel URL</Label>
            <Input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Etiket</Label>
            <Input value={form.tag} onChange={(e) => update("tag", e.target.value)} placeholder="Superhost" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Enlem (Latitude)</Label>
            <Input type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="40.7128" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Boylam (Longitude)</Label>
            <Input type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="29.9441" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="font-body">Açıklama</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Ev hakkında kısa bilgi..." />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="font-body">Gizli Açıklama (Sadece onaylı üyeler görür)</Label>
            <Textarea value={form.private_description} onChange={(e) => update("private_description", e.target.value)} placeholder="Adres, yol tarifi vb. gizli bilgiler..." />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting} className="font-body">
              {submitting ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ev Ekle"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <h3 className="font-display text-xl font-bold text-foreground p-6 pb-4">Mevcut Evler</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Başlık</TableHead>
              <TableHead className="font-body">Konum</TableHead>
              <TableHead className="font-body">Fiyat</TableHead>
              <TableHead className="font-body">Tarih Aralığı</TableHead>
              <TableHead className="font-body text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {houses.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-body font-medium">{h.title}</TableCell>
                <TableCell className="font-body text-muted-foreground">{h.location || "—"}</TableCell>
                <TableCell className="font-body">₺{Number(h.price).toLocaleString()}</TableCell>
                <TableCell className="font-body text-xs text-muted-foreground">
                  {h.available_from && h.available_to
                    ? `${format(new Date(h.available_from), "dd/MM/yy")} – ${format(new Date(h.available_to), "dd/MM/yy")}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(h)}>
                    <Pencil className="w-4 h-4 text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {houses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center font-body text-muted-foreground py-8">
                  Henüz ev eklenmedi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HouseManagement;
