import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  approved: boolean;
  role: AppRole;
  role_row_id: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, approved");
    const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");

    if (profiles && roles) {
      const merged: UserWithRole[] = profiles.map((p) => {
        const r = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          approved: p.approved ?? false,
          role: (r?.role as AppRole) ?? "user",
          role_row_id: r?.id ?? "",
        };
      });
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (roleRowId: string, newRole: AppRole) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleRowId);
    if (error) {
      toast.error("Rol güncellenemedi: " + error.message);
    } else {
      toast.success("Rol güncellendi");
      setUsers((prev) => prev.map((u) => (u.role_row_id === roleRowId ? { ...u, role: newRole } : u)));
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    const { error } = await supabase.from("profiles").update({ approved }).eq("user_id", userId);
    if (error) {
      toast.error("Durum güncellenemedi: " + error.message);
    } else {
      toast.success(approved ? "Üye onaylandı" : "Üye onayı kaldırıldı");
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, approved } : u)));
    }
  };

  if (loading) return <p className="font-body text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">Kullanıcı</TableHead>
            <TableHead className="font-body">Durum</TableHead>
            <TableHead className="font-body">Rol</TableHead>
            <TableHead className="font-body text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.user_id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {(u.display_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-body font-medium text-foreground">{u.display_name || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                {u.approved ? (
                  <Badge variant="default" className="font-body gap-1 bg-green-600">
                    <CheckCircle className="w-3 h-3" /> Onaylı
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-body gap-1">
                    <XCircle className="w-3 h-3" /> Bekliyor
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Select value={u.role} onValueChange={(v) => handleRoleChange(u.role_row_id, v as AppRole)}>
                  <SelectTrigger className="w-28 font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="mod">Moderatör</SelectItem>
                    <SelectItem value="user">Üye</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                {u.approved ? (
                  <Button variant="ghost" size="sm" className="font-body text-destructive" onClick={() => handleApproval(u.user_id, false)}>
                    Onayı Kaldır
                  </Button>
                ) : (
                  <Button variant="default" size="sm" className="font-body" onClick={() => handleApproval(u.user_id, true)}>
                    Onayla
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;
