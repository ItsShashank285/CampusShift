"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client";

export type AccountRoleState = "loading" | "signed-out" | "student" | "business" | "unknown";

/** Reads the trusted role from the user's public.profiles row. */
export function useAccountRole(): AccountRoleState {
  const [role, setRole] = useState<AccountRoleState>("loading");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!isSupabaseConfigured() || !supabase) {
      setRole("signed-out");
      return;
    }

    let active = true;

    const loadProfileRole = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;
      if (error || !data || (data.role !== "student" && data.role !== "business")) {
        setRole("unknown");
        return;
      }
      setRole(data.role);
    };

    const loadInitialRole = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setRole("signed-out");
        return;
      }
      await loadProfileRole(data.user.id);
    };

    void loadInitialRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setRole("signed-out");
        return;
      }
      setRole("loading");
      // Defer the profile query until after Supabase finishes its auth callback.
      queueMicrotask(() => { void loadProfileRole(session.user.id); });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return role;
}
