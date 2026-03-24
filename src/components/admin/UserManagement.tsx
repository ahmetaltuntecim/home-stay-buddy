import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  role_row_id: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url");
    const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");

    if (profiles && roles) {
      const merged: UserWithRole[] = profiles.map((p) => {
        const r = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          role: (r?.role as AppRole) ?? "user",
          role_row_id: r?.id ?? "",
        };
      });
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (roleRowId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("id", roleRowId);

    if (error) {
      toast.error("Rol güncellenemedi: " + error.message);
    } else {
      toast.success("Rol güncellendi");
      setUsers((prev) =>
        prev.map((u) => (u.role_row_id === roleRowId ? { ...u, role: newRole } : u))
      );
    }
  };

  if (loading) return <p className="font-body text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">Kullanıcı</TableHead>
            <TableHead className="font-body">User ID</TableHead>
            <TableHead className="font-body text-right">Rol</TableHead>
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
              <TableCell className="font-body text-xs text-muted-foreground max-w-[180px] truncate">
                {u.user_id}
              </TableCell>
              <TableCell className="text-right">
                <Select value={u.role} onValueChange={(v) => handleRoleChange(u.role_row_id, v as AppRole)}>
                  <SelectTrigger className="w-28 ml-auto font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="mod">Moderatör</SelectItem>
                    <SelectItem value="user">Üye</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;
