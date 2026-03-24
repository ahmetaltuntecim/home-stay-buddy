import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setRole(data?.role ?? "user");
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isMod = role === "mod";
  const hasAdminAccess = isAdmin || isMod;

  return { role, isAdmin, isMod, hasAdminAccess, loading };
};
