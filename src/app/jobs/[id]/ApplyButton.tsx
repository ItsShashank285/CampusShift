"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccountRole } from "../../../lib/useAccountRole";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

type ApplyButtonProps = {
  jobId: string;
  jobTitle: string;
  company: string;
  pay: number;
  day: string;
  time: string;
  match: number;
  college: string;
  course: string;
  source?: "demo" | "database";
};

export default function ApplyButton({
  jobId,
  jobTitle,
  company,
  pay,
  day,
  time,
  match,
  college,
  course,
  source = "demo",
}: ApplyButtonProps) {
  const role = useAccountRole();
  const supabase = getSupabaseBrowserClient();
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function checkApplication() {
      if (role !== "student" || source !== "database" || !supabase) {
        setApplied(role === "student" && source === "demo" && Boolean(localStorage.getItem(`application-${jobId}`)));
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: queryError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("student_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (queryError) setError("Couldn't check your application status. Apply after the database migration is installed.");
        setApplied(Boolean(data));
      }
    }
    void checkApplication();
    return () => { cancelled = true; };
  }, [jobId, role, source, supabase]);

  const handleApply = async () => {
    if (role !== "student") return;
    setError("");
    if (source !== "database") {
      setError("This is a sample listing. Applications are only available for live jobs posted by a business.");
      return;
    }
    if (!supabase) {
      setError("Applications need CampusShift's Supabase database to be configured.");
      return;
    }

    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Please sign in again as a student before applying.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("job_applications").insert({
      job_id: jobId,
      student_id: user.id,
      status: "pending",
      cover_note: "",
    });
    if (insertError) {
      setError(insertError.code === "23505"
        ? "You've already applied for this job."
        : `Application couldn't be saved: ${insertError.message}`);
      if (insertError.code === "23505") setApplied(true);
      setLoading(false);
      return;
    }

    setApplied(true);
    setLoading(false);
  };

  if (role === "loading") {
    return <button type="button" className="btn btn-primary" disabled style={{ width: "100%", minHeight: 54, marginTop: 28 }}>Checking account permissions…</button>;
  }

  if (role === "business") {
    return (
      <div className="notice-card notice-warning" role="status">
        <strong>Student applications only</strong>
        <p>Business accounts cannot apply for jobs. You are signed in to the business workspace.</p>
        <Link href="/business" className="btn btn-secondary" style={{ marginTop: 12 }}>Return to business dashboard</Link>
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="notice-card notice-info" role="status">
        <strong>Sign in as a student to apply</strong>
        <p>You can browse available jobs without an account, but applications are only available to student accounts.</p>
        <Link href="/login?role=student" className="btn btn-primary" style={{ marginTop: 12 }}>Student sign in</Link>
      </div>
    );
  }

  return (
    <>
      {applied ? (
        <>
          <div className="apply-success" role="status">✓ Application saved to your account — check your dashboard for its status.</div>
          <div className="hero-actions" style={{ marginTop: 12 }}>
            <Link href="/dashboard" className="btn btn-primary">Student dashboard <span aria-hidden="true">→</span></Link>
            <Link href="/jobs" className="btn btn-secondary">Explore more jobs</Link>
          </div>
        </>
      ) : (
        <button onClick={handleApply} disabled={loading} className="btn btn-primary" style={{ width: "100%", minHeight: 54, marginTop: 28, fontSize: "1rem" }}>
          {loading ? "Submitting application…" : <>Apply for this job <span aria-hidden="true">→</span></>}
        </button>
      )}
      {error && <div className="notice-card notice-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
    </>
  );
}
