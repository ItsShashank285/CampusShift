"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase/client";

type AccountRole = "student" | "business";
type GuardState = "loading" | "allowed" | "redirecting" | "unconfigured" | "profile-error";

type RoleGuardProps = {
  requiredRole: AccountRole;
  children: ReactNode;
  /** If true, logged-out visitors may browse this area, but the opposite account role is redirected. */
  allowPublic?: boolean;
};

/** Role guard for workspaces and the public jobs area. RLS must also protect database writes. */
export default function RoleGuard({ requiredRole, children, allowPublic = false }: RoleGuardProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<GuardState>("loading");
  const [details, setDetails] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkUserRole = async (userId: string) => {
      const { data: profile, error: profileError } = await supabase!
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (profileError || !profile || (profile.role !== "student" && profile.role !== "business")) {
        setDetails(profileError?.message || "Your account role could not be verified. Please sign in again.");
        setState("profile-error");
        return;
      }
      if (profile.role !== requiredRole) {
        setState("redirecting");
        router.replace(profile.role === "business" ? "/business" : "/dashboard");
        return;
      }
      setState("allowed");
    };

    const verifyRole = async () => {
      if (!configured || !supabase) {
        setState(allowPublic ? "allowed" : "unconfigured");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !userData.user) {
        if (allowPublic) {
          setState("allowed");
        } else {
          setState("redirecting");
          router.replace(`/login?role=${requiredRole}`);
        }
        return;
      }
      await checkUserRole(userData.user.id);
    };

    void verifyRole();

    const authListener = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        if (allowPublic) {
          setState("allowed");
        } else {
          setState("redirecting");
          router.replace(`/login?role=${requiredRole}`);
        }
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setState("loading");
        queueMicrotask(() => { void checkUserRole(session.user.id); });
      }
    });

    return () => {
      cancelled = true;
      authListener?.data.subscription.unsubscribe();
    };
  }, [allowPublic, configured, requiredRole, router, supabase]);

  if (state === "allowed") return <>{children}</>;

  return (
    <main className="page-shell">
      <div className="container narrow-container">
        {state === "unconfigured" ? (
          <div className="notice-card notice-warning" role="status">
            <strong>Authentication setup required</strong>
            <p>CampusShift needs its Supabase settings before it can verify this workspace.</p>
            <Link className="btn btn-primary" href="/login" style={{ marginTop: 16 }}>Go to sign in</Link>
          </div>
        ) : state === "profile-error" ? (
          <div className="notice-card notice-error" role="alert">
            <strong>Couldn't verify your account role</strong>
            <p>{details}</p>
            <Link className="btn btn-secondary" href="/login" style={{ marginTop: 16 }}>Return to sign in</Link>
          </div>
        ) : (
          <div className="empty-state" role="status">
            <p>{state === "redirecting" ? "Taking you to your account's workspace…" : "Checking your account and workspace permissions…"}</p>
          </div>
        )}
      </div>
    </main>
  );
}
