import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface HouseForm {
  title: string;
  description: string;
  capacity: string;
  price: string;
  image_url: string;
  location: string;
  tag: string;
}

const emptyForm: HouseForm = { title: "", description: "", capacity: "2", price: "", image_url: "", location: "", tag: "" };

const HouseManagement = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<HouseForm>(emptyForm);
  const [houses, setHouses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchHouses = async () => {
    const { data } = await supabase.from("houses").select("*").order("created_at", { ascending: false });
    if (data) setHouses(data);
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      toast.error("Başlık ve fiyat zorunludur");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("houses").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      capacity: parseInt(form.capacity) || 2,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      location: form.location.trim() || null,
      tag: form.tag.trim() || null,
      created_by: user?.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Ev eklenemedi: " + error.message);
    } else {
      toast.success("Ev başarıyla eklendi!");
      setForm(emptyForm);
      fetchHouses();
    }
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

  const update = (key: keyof HouseForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display text-xl font-bold text-foreground mb-4">Yeni Ev Ekle</h3>
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
            <Label className="font-body">Görsel URL</Label>
            <Input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Etiket</Label>
            <Input value={form.tag} onChange={(e) => update("tag", e.target.value)} placeholder="Superhost" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="font-body">Açıklama</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Ev hakkında kısa bilgi..." />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting} className="font-body">
              {submitting ? "Ekleniyor..." : "Ev Ekle"}
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
              <TableHead className="font-body">Kapasite</TableHead>
              <TableHead className="font-body text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {houses.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-body font-medium">{h.title}</TableCell>
                <TableCell className="font-body text-muted-foreground">{h.location || "—"}</TableCell>
                <TableCell className="font-body">₺{Number(h.price).toLocaleString()}</TableCell>
                <TableCell className="font-body">{h.capacity}</TableCell>
                <TableCell className="text-right">
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
