"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import RoleGuard from "../components/RoleGuard";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Application = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  pay: number;
  day: string;
  time: string;
  category: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
};

function StudentDashboardContent() {
  const supabase = getSupabaseBrowserClient();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("Student");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (!cancelled && profile?.full_name) setName(profile.full_name.split(" ")[0]);

      const { data, error: queryError } = await supabase
        .from("job_applications")
        .select("id, status, created_at, job:jobs(id, title, company, pay, shift_day, shift_time, category)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (queryError) {
        setError("Applications couldn't be loaded. Apply the marketplace migration in Supabase, then refresh this page.");
      } else {
        const rows = (data ?? []) as unknown as Array<{
          id: string; status: Application["status"]; created_at: string;
          job: { id: string; title: string; company: string; pay: number; shift_day: string; shift_time: string; category: string } | null;
        }>;
        setApplications(rows.filter((row) => row.job).map((row) => ({
          id: row.id, jobId: row.job!.id, title: row.job!.title, company: row.job!.company,
          pay: Number(row.job!.pay), day: row.job!.shift_day, time: row.job!.shift_time,
          category: row.job!.category, status: row.status, createdAt: row.created_at,
        })));
      }
      setLoading(false);
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, [supabase]);

  const acceptedCount = applications.filter((application) => application.status === "accepted").length;
  const pendingCount = applications.filter((application) => application.status === "pending").length;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <div className="dashboard-header animate-in">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> YOUR STUDENT SPACE</p>
              <h1 className="page-title">Welcome back, <span className="gradient-text">{name}.</span></h1>
              <p className="page-description">Keep track of your applications and find the next opportunity that fits your schedule.</p>
            </div>
            <div className="dashboard-user"><div className="avatar">{name.charAt(0).toUpperCase()}</div><div><strong>Student profile</strong><div className="small-muted" style={{ marginTop: 3 }}>Verification status not yet confirmed</div></div></div>
          </div>

          {error && <div className="notice-card notice-error" role="alert">{error}</div>}
          <section className="dashboard-stats" aria-label="Application summary">
            <div className="stat-card" style={{ "--delay": "60ms" } as CSSProperties}><div className="stat-label">Total applications</div><div className="stat-value">{applications.length}</div><div className="stat-footnote">Your next step starts here</div></div>
            <div className="stat-card" style={{ "--delay": "140ms" } as CSSProperties}><div className="stat-label">Awaiting a response</div><div className="stat-value">{pendingCount}</div><div className="stat-footnote">Keep an eye on your status</div></div>
            <div className="stat-card" style={{ "--delay": "220ms" } as CSSProperties}><div className="stat-label">Accepted applications</div><div className="stat-value">{acceptedCount}</div><div className="stat-footnote">Small wins add up ✦</div></div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div><p className="eyebrow"><span className="eyebrow-dot" /> APPLICATION TRACKER</p><h2 className="section-title">My applications</h2></div>
              <Link href="/jobs" className="btn btn-secondary">Find more jobs <span aria-hidden="true">→</span></Link>
            </div>
            {loading ? <div className="empty-state"><p>Loading your applications…</p></div> : applications.length === 0 ? (
              <div className="empty-state animate-in">
                <div className="empty-icon" aria-hidden="true">✦</div>
                <h3>Your next opportunity is out there.</h3>
                <p>You haven't applied to any live roles yet. Explore flexible shifts and your applications will appear here on every device.</p>
                <Link href="/jobs" className="btn btn-primary" style={{ marginTop: 21 }}>Explore student jobs <span aria-hidden="true">→</span></Link>
              </div>
            ) : (
              <div className="application-list">
                {applications.map((application, index) => {
                  const statusClass = application.status === "accepted" ? "status-accepted" : application.status === "rejected" || application.status === "withdrawn" ? "status-rejected" : "";
                  const displayStatus = application.status.charAt(0).toUpperCase() + application.status.slice(1);
                  return (
                    <article key={application.id} className="application-card" style={{ "--delay": `${index * 85}ms` } as CSSProperties}>
                      <div className="application-main">
                        <div className="application-identity">
                          <div className="job-icon" aria-hidden="true">💼</div>
                          <div><h3 className="application-title">{application.title}</h3><p className="application-subtitle">{application.company} · {application.category}</p></div>
                        </div>
                        <span className={`status-pill ${statusClass}`}>{displayStatus}</span>
                      </div>
                      <div className="application-meta">
                        <div className="info-tile"><p className="info-label">Hourly pay</p><p className="info-value">₹{application.pay}/hr</p></div>
                        <div className="info-tile"><p className="info-label">Shift day</p><p className="info-value">{application.day}</p></div>
                        <div className="info-tile"><p className="info-label">Hours</p><p className="info-value">{application.time}</p></div>
                      </div>
                      <div className="action-row"><Link href={`/jobs/${application.jobId}`} className="btn btn-quiet">View job details ↗</Link><span className="small-muted" style={{ alignSelf: "center" }}>Applied {new Date(application.createdAt).toLocaleDateString()}</span></div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return <RoleGuard requiredRole="student"><StudentDashboardContent /></RoleGuard>;
}
