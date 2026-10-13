"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase/client";

type AccountRole = "student" | "business";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<AccountRole>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "business") setRole("business");
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured yet. Follow SUPABASE_SETUP.md, add the two environment variables, and restart the app.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), role },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (signupError) throw signupError;
        if (!data.session) {
          setNotice("Account created. Check your email for a confirmation link, then return here to sign in.");
          setMode("signin");
          return;
        }
        router.replace(role === "business" ? "/business" : "/dashboard");
        router.refresh();
        return;
      }

      const { data, error: signinError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signinError) throw signinError;
      if (!data.user) throw new Error("Sign-in succeeded but no user account was returned. Please try again.");

      // Read the role from the protected profile table. Do not trust user_metadata
      // as the source of authorization decisions.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) throw new Error(`Couldn't verify your account role: ${profileError.message}`);
      if (!profile || (profile.role !== "student" && profile.role !== "business")) {
        throw new Error("We couldn't find a valid CampusShift role for this account. Check the Supabase schema and try again.");
      }

      router.replace(profile.role === "business" ? "/business" : "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-shell auth-shell">
        <div className="container auth-container">
          <div className="auth-heading animate-in">
            <p className="eyebrow"><span className="eyebrow-dot" /> ONE ACCOUNT, YOUR WORKSPACE</p>
            <h1 className="page-title">Welcome to <span className="gradient-text">CampusShift.</span></h1>
            <p className="page-description">Sign in to continue, or create an account to join the student job marketplace.</p>
          </div>

          {!configured && (
            <div className="notice-card notice-warning" role="status">
              <strong>One-time setup needed</strong>
              <p>Connect your Supabase project before accounts can be created. Follow the instructions in <code>SUPABASE_SETUP.md</code>.</p>
            </div>
          )}

          <section className="auth-card animate-in" style={{ "--delay": "100ms" } as CSSProperties}>
            <div className="auth-mode-switch" role="group" aria-label="Authentication mode">
              <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</button>
              <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create account</button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              {mode === "signup" && (
                <label className="form-field">
                  <span>Full name</span>
                  <input required minLength={2} maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" autoComplete="name" />
                </label>
              )}

              {mode === "signup" ? (
                <fieldset className="role-choice">
                  <legend>I&apos;m joining as</legend>
                  <div className="role-choice-grid">
                    <button type="button" aria-pressed={role === "student"} className={role === "student" ? "selected" : ""} onClick={() => setRole("student")}>
                      <span aria-hidden="true">🎓</span><span><strong>Student</strong><small>Discover and apply for jobs</small></span>
                    </button>
                    <button type="button" aria-pressed={role === "business"} className={role === "business" ? "selected" : ""} onClick={() => setRole("business")}>
                      <span aria-hidden="true">🏢</span><span><strong>Business</strong><small>Publish and manage jobs</small></span>
                    </button>
                  </div>
                </fieldset>
              ) : (
                <div className="notice-card notice-info">
                  Your account&apos;s saved role determines your workspace after sign-in. Business and student workspaces cannot be switched from the navigation.
                </div>
              )}

              <label className="form-field">
                <span>Email address</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
              </label>
              <label className="form-field">
                <span>Password</span>
                <input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "Create a password (at least 6 characters)" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </label>

              {error && <div className="notice-card notice-error" role="alert">{error}</div>}
              {notice && <div className="notice-card notice-success" role="status">{notice}</div>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={busy || !configured}>
                {busy ? "Please wait…" : mode === "signup" ? "Create my account" : "Sign in"} <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
          <p className="auth-footnote">By continuing, you agree to use CampusShift responsibly and provide accurate account information.</p>
          <Link href="/" className="back-link">← Back to CampusShift</Link>
        </div>
      </main>
    </>
  );
}
