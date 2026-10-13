"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import RoleGuard from "../components/RoleGuard";
import { jobs as demoJobs } from "../jobs/jobs";
import { databaseRowToJob, type DatabaseJobRow, type JobListing } from "../../lib/jobs";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase/client";

type Application = {
  jobId: string;
  job: string;
  company: string;
  pay?: number;
  date: string;
  time: string;
  status: string;
  studentName: string;
  college: string;
  course: string;
  experience: string;
  match: number;
};

type AccountProfile = { role: "student" | "business"; full_name: string };

function BusinessDashboardContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("notice") === "job-saved") setMessage("Your job listing was saved successfully.");
    const savedApplications: Application[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("application-")) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      try {
        const data = JSON.parse(value) as Partial<Application> & { jobTitle?: string; day?: string };
        const jobId = String(data.jobId || key.replace("application-", ""));
        const knownJob = demoJobs.find((item) => item.id === jobId);
        savedApplications.push({
          jobId,
          job: data.job || data.jobTitle || knownJob?.title || "Job application",
          company: data.company || knownJob?.company || "Company not listed",
          pay: typeof data.pay === "number" ? data.pay : knownJob?.pay,
          date: data.date || data.day || knownJob?.day || "Not specified",
          time: data.time || knownJob?.time || "Not specified",
          status: data.status || "Pending",
          studentName: data.studentName || "Student Applicant",
          college: data.college || "College not added",
          course: data.course || "Not specified",
          experience: data.experience || "Not provided",
          match: typeof data.match === "number" ? data.match : knownJob?.match || 0,
        });
      } catch {
        // Old incomplete browser records should not crash the dashboard.
      }
    }
    setApplications(savedApplications);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadBusinessData() {
      if (!supabase || !user) {
        setProfile(null);
        setJobs([]);
        return;
      }
      setJobsLoading(true);
      setError("");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setError(`Couldn't load your account profile: ${profileError.message}. Check that supabase/schema.sql has been run.`);
        setProfile(null);
        setJobsLoading(false);
        return;
      }
      setProfile(profileData as AccountProfile | null);
      if (profileData?.role !== "business") {
        setJobs([]);
        setJobsLoading(false);
        return;
      }
      const { data: jobRows, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (jobsError) {
        setError(`Couldn't load your job listings: ${jobsError.message}`);
        setJobs([]);
      } else {
        setJobs(((jobRows || []) as DatabaseJobRow[]).map(databaseRowToJob));
      }
      setJobsLoading(false);
    }
    void loadBusinessData();
    return () => { cancelled = true; };
  }, [supabase, user]);

  const handleStatusChange = (jobId: string, newStatus: string) => {
    const updatedApplications = applications.map((application) =>
      application.jobId === jobId ? { ...application, status: newStatus } : application
    );
    setApplications(updatedApplications);
    const updatedApplication = updatedApplications.find((application) => application.jobId === jobId);
    if (updatedApplication) localStorage.setItem(`application-${jobId}`, JSON.stringify(updatedApplication));
  };

  const handleToggleJob = async (job: JobListing) => {
    if (!supabase || !user) return;
    setError("");
    setMessage("");
    const nextStatus = job.status === "active" ? "closed" : "active";
    const { data, error: updateError } = await supabase
      .from("jobs")
      .update({ status: nextStatus })
      .eq("id", job.id)
      .eq("owner_id", user.id)
      .select("*")
      .single();
    if (updateError) {
      setError(`Couldn't update this listing: ${updateError.message}`);
      return;
    }
    setJobs((current) => current.map((item) => item.id === job.id ? databaseRowToJob(data as DatabaseJobRow) : item));
    setMessage(`“${job.title}” is now ${nextStatus}.`);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("You've signed out.");
  };

  const pendingCount = applications.filter((application) => application.status === "Pending").length;
  const acceptedCount = applications.filter((application) => application.status === "Accepted").length;
  const activeJobCount = jobs.filter((job) => job.status === "active").length;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <div className="dashboard-header animate-in">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> BUSINESS WORKSPACE</p>
              <h1 className="page-title">Build your team with <span className="gradient-text">student talent.</span></h1>
              <p className="page-description">Publish opportunities, manage your open shifts, and find reliable people to support your business.</p>
            </div>
            {profile?.role === "business" && (
              <div className="dashboard-user">
                <div className="avatar">{(profile.full_name || user?.email || "B").trim().charAt(0).toUpperCase()}</div>
                <div><strong>{profile.full_name || user?.email || "Business account"}</strong><div className="small-muted" style={{ marginTop: 3 }}>Business account</div></div>
              </div>
            )}
          </div>

          {error && <div className="notice-card notice-error" role="alert">{error}</div>}
          {message && <div className="notice-card notice-success" role="status">{message}</div>}

          {!configured ? (
            <div className="notice-card notice-warning dashboard-notice">
              <h2>Connect the shared database first</h2>
              <p>The business publishing workflow needs a Supabase project. Follow <code>SUPABASE_SETUP.md</code>, run <code>supabase/schema.sql</code> in SQL Editor, add the two environment variables, and restart the app.</p>
              <Link href="https://supabase.com/dashboard" className="btn btn-primary">Open Supabase <span aria-hidden="true">↗</span></Link>
            </div>
          ) : authLoading ? (
            <div className="empty-state"><p>Checking your business account…</p></div>
          ) : !user ? (
            <div className="empty-state animate-in">
              <div className="empty-icon" aria-hidden="true">🏢</div>
              <h2>Sign in to manage your business</h2>
              <p>Create a business account or sign in to publish jobs and manage your own listings.</p>
              <Link href="/login?role=business" className="btn btn-primary" style={{ marginTop: 20 }}>Sign in or create account <span aria-hidden="true">→</span></Link>
            </div>
          ) : profile?.role !== "business" ? (
            <div className="empty-state animate-in">
              <div className="empty-icon" aria-hidden="true">🎓</div>
              <h2>This is a business workspace</h2>
              <p>You are signed in as a student account. Sign out and create or use a business account to publish job openings.</p>
              <div className="hero-actions" style={{ justifyContent: "center", marginTop: 20 }}>
                <Link href="/login?role=business&mode=signup" className="btn btn-primary">Create business account</Link>
                <button type="button" className="btn btn-secondary" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <>
              <section className="dashboard-stats" aria-label="Business overview">
                <div className="stat-card" style={{ "--delay": "60ms" } as CSSProperties}><div className="stat-label">Active jobs</div><div className="stat-value">{activeJobCount}</div><div className="stat-footnote">Your published opportunities</div></div>
                <div className="stat-card" style={{ "--delay": "140ms" } as CSSProperties}><div className="stat-label">Pending applications</div><div className="stat-value">{pendingCount}</div><div className="stat-footnote">Ready for your review</div></div>
                <div className="stat-card" style={{ "--delay": "220ms" } as CSSProperties}><div className="stat-label">Accepted applicants</div><div className="stat-value">{acceptedCount}</div><div className="stat-footnote">Students you have accepted</div></div>
              </section>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div><p className="eyebrow"><span className="eyebrow-dot" /> BUSINESS LISTINGS</p><h2 className="section-title">Manage your jobs</h2></div>
                  <div className="hero-actions">
                    <Link href="/business/jobs/new" className="btn btn-primary"><span aria-hidden="true">＋</span> Post a Job</Link>
                  </div>
                </div>

                {jobsLoading ? <div className="empty-state"><p>Loading your job listings…</p></div> : jobs.length === 0 ? (
                  <div className="empty-state animate-in">
                    <div className="empty-icon" aria-hidden="true">✦</div>
                    <h3>Your next great teammate starts with a job post.</h3>
                    <p>You haven&apos;t posted any jobs yet. Create your first opening and it can appear in the public jobs marketplace.</p>
                    <Link href="/business/jobs/new" className="btn btn-primary" style={{ marginTop: 20 }}>Create your first job <span aria-hidden="true">→</span></Link>
                  </div>
                ) : (
                  <div className="job-management-grid">
                    {jobs.map((job, index) => (
                      <article key={job.id} className="job-management-card" style={{ "--delay": `${index * 65}ms` } as CSSProperties}>
                        <div className="job-management-top">
                          <div className="job-icon" aria-hidden="true">{job.icon}</div>
                          <span className={`status-pill ${job.status === "active" ? "status-accepted" : "status-rejected"}`}>{job.status === "active" ? "Active" : "Closed"}</span>
                        </div>
                        <div className="job-badges"><span className="soft-badge">{job.category}</span><span className="soft-badge">{job.workMode}</span><span className="soft-badge">{job.shiftType}</span></div>
                        <h3 className="panel-title job-management-title">{job.title}</h3>
                        <p className="small-muted">{job.company}</p>
                        <p className="job-description">{job.description}</p>
                        <div className="business-job-details"><span>₹{job.pay}/hour</span><span>⌖ {job.location}</span><span>♧ {job.workersNeeded} needed</span></div>
                        <div className="job-management-actions">
                          <Link href={`/business/jobs/${job.id}/edit`} className="btn btn-secondary">Edit listing</Link>
                          <button type="button" className={job.status === "active" ? "btn btn-danger" : "btn btn-primary"} onClick={() => void handleToggleJob(job)}>{job.status === "active" ? "Close job" : "Reopen job"}</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div><p className="eyebrow"><span className="eyebrow-dot" /> CANDIDATE PIPELINE</p><h2 className="section-title">Student applications</h2></div>
                  <span className="soft-badge">{applications.length} total</span>
                </div>

                <div className="notice-card notice-info application-storage-note"><strong>Prototype note</strong><p>Job listings are now shared through the database. Application records and accept/reject status still live in this browser until we connect applications to the database in the next milestone.</p></div>

                {applications.length === 0 ? (
                  <div className="empty-state animate-in">
                    <div className="empty-icon" aria-hidden="true">♧</div>
                    <h3>Student applications will appear here.</h3>
                    <p>Once application storage is connected to the shared database, you will be able to review students who apply to your openings.</p>
                    <Link href="/business/jobs/new" className="btn btn-primary" style={{ marginTop: 21 }}>Post your first job <span aria-hidden="true">→</span></Link>
                  </div>
                ) : (
                  <div className="application-list">
                    {applications.map((application, index) => {
                      const statusClass = application.status === "Accepted" ? "status-accepted" : application.status === "Rejected" ? "status-rejected" : "";
                      const initial = application.studentName?.trim().charAt(0) || "S";
                      return (
                        <article key={`${application.jobId}-${index}`} className="application-card" style={{ "--delay": `${index * 75}ms` } as CSSProperties}>
                          <div className="application-main">
                            <div className="application-identity"><div className="avatar avatar-large">{initial.toUpperCase()}</div><div><h3 className="application-title">{application.studentName || "Student Applicant"}</h3><p className="application-subtitle">{application.college || "College not added"}</p></div></div>
                            <span className={`status-pill ${statusClass}`}>{application.status || "Pending"}</span>
                          </div>
                          <div style={{ marginTop: 22 }}><p className="info-label">APPLIED FOR</p><h4 className="panel-title" style={{ marginTop: 7 }}>{application.job || "Job application"}</h4><p className="small-muted" style={{ marginTop: 5 }}>{application.company || "Company not listed"}</p></div>
                          <div className="application-meta">
                            <div className="info-tile"><p className="info-label">Course</p><p className="info-value">{application.course || "Not specified"}</p></div>
                            <div className="info-tile"><p className="info-label">Experience</p><p className="info-value">{application.experience || "Not provided"}</p></div>
                            <div className="info-tile"><p className="info-label">Match</p><p className="info-value">{application.match || 0}%</p></div>
                          </div>
                          <div className="business-job-details"><span>₹{application.pay ?? "—"} / hour</span><span>◷ {application.date || "Not specified"}</span><span>◷ {application.time || "Not specified"}</span></div>
                          {application.status === "Pending" && <div className="action-row"><button type="button" onClick={() => handleStatusChange(application.jobId, "Accepted")} className="btn btn-primary">Accept applicant <span aria-hidden="true">✓</span></button><button type="button" onClick={() => handleStatusChange(application.jobId, "Rejected")} className="btn btn-danger">Decline</button></div>}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
              <div className="signout-row"><span className="small-muted">Signed in as {user.email}</span><button type="button" className="btn btn-quiet" onClick={handleSignOut}>Sign out</button></div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function BusinessPage() {
  return (
    <RoleGuard requiredRole="business">
      <BusinessDashboardContent />
    </RoleGuard>
  );
}
