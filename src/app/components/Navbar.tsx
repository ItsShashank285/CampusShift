"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAccountRole } from "../../lib/useAccountRole";

export default function Navbar() {
  const router = useRouter();
  const role = useAccountRole();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="CampusShift home">
          <span className="brand-mark">CS</span>
          <span className="brand-word">Campus<span className="brand-accent">Shift</span></span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {role === "student" && (
            <>
              <Link href="/jobs" className="nav-link">Find jobs</Link>
              <Link href="/dashboard" className="nav-link">My dashboard</Link>
            </>
          )}
          {role === "business" && (
            <>
              <Link href="/business" className="nav-link">Business dashboard</Link>
              <Link href="/business/jobs/new" className="nav-link">Post a job</Link>
            </>
          )}
          {role === "signed-out" && (
            <>
              <Link href="/jobs" className="nav-link">Find jobs</Link>
              <Link href="/login?role=business" className="nav-link">For businesses</Link>
              <Link href="/#how-it-works" className="nav-link">How it works</Link>
            </>
          )}
          {role === "unknown" && <Link href="/login" className="nav-link">Account help</Link>}
        </nav>

        <div className="nav-actions">
          {role === "student" || role === "business" ? (
            <button type="button" onClick={() => void handleSignOut()} className="btn btn-secondary nav-signout">Sign out</button>
          ) : role === "signed-out" ? (
            <>
              <Link href="/login" className="nav-login">Log in</Link>
              <Link href="/login?mode=signup" className="btn btn-primary">Get started <span aria-hidden="true">↗</span></Link>
            </>
          ) : role === "unknown" ? (
            <Link href="/login" className="btn btn-secondary">Sign in again</Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
