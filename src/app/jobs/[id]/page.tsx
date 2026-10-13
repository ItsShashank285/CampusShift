"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { jobs as demoJobs } from "../jobs";
import ApplyButton from "./ApplyButton";
import { databaseRowToJob, type DatabaseJobRow, type JobListing } from "../../../lib/jobs";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import RoleGuard from "../../components/RoleGuard";

function JobDetailsPageContent() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = getSupabaseBrowserClient();
  const demoJob = demoJobs.find((item) => item.id === id);
  const [job, setJob] = useState<JobListing | null>(demoJob ? { ...demoJob, source: "demo" } : null);
  const [loading, setLoading] = useState(!demoJob);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const localJob = demoJobs.find((item) => item.id === id);
    if (localJob) {
      setJob({ ...localJob, source: "demo" });
      setLoading(false);
      return () => { cancelled = true; };
    }
    async function loadJob() {
      if (!supabase) {
        setJob(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setJob(null);
      } else {
        setJob(data ? databaseRowToJob(data as DatabaseJobRow) : null);
      }
      setLoading(false);
    }
    void loadJob();
    return () => { cancelled = true; };
  }, [id, supabase]);

  if (loading) {
    return <><Navbar /><main className="page-shell"><div className="container empty-state"><p>Loading job details…</p></div></main></>;
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="container empty-state">
            <div className="empty-icon" aria-hidden="true">⌕</div>
            <h1 className="page-title" style={{ fontSize: "2rem" }}>We couldn&apos;t find that job.</h1>
            <p>{loadError ? `The job couldn't be loaded: ${loadError}` : "This opportunity may have been removed, closed, or the link may be incorrect."}</p>
            <Link href="/jobs" className="btn btn-primary" style={{ marginTop: 22 }}>Back to jobs <span aria-hidden="true">→</span></Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <Link href="/jobs" className="breadcrumb"><span aria-hidden="true">←</span> Back to opportunities</Link>
          <div className="details-wrap animate-in">
            <article className="glass-panel details-panel">
              <div className="job-top">
                <div className="job-identity">
                  <div className="job-icon" style={{ width: 68, height: 68, fontSize: "2rem", borderRadius: 20 }} aria-hidden="true">{job.icon}</div>
                  <div>
                    <p className="eyebrow"><span className="eyebrow-dot" /> {job.category} · STUDENT OPPORTUNITY</p>
                    <h1 className="details-title" style={{ marginTop: 12 }}>{job.title}</h1>
                    <p className="details-company">{job.company}</p>
                  </div>
                </div>
                {typeof job.match === "number" ? <span className="match-badge">{job.match}% match</span> : <span className="match-badge">New listing</span>}
              </div>

              <div className="job-badges" style={{ marginTop: 25 }}>
                <span className="soft-badge">Student friendly</span>
                <span className="soft-badge">{job.workMode}</span>
                <span className="soft-badge">{job.shiftType}</span>
                <span className="soft-badge">{job.source === "database" ? "Business-published" : "Sample listing"}</span>
              </div>

              <div className="details-grid">
                <div className="info-tile"><p className="info-label">Hourly pay</p><p className="info-value">₹{job.pay}/hr</p></div>
                <div className="info-tile"><p className="info-label">{job.location ? "Location" : "Distance"}</p><p className="info-value">{job.location || job.distance || "Not specified"}</p></div>
                <div className="info-tile"><p className="info-label">Shift day</p><p className="info-value">{job.day}</p></div>
                <div className="info-tile"><p className="info-label">Hours</p><p className="info-value">{job.time}</p></div>
              </div>

              <section className="details-section"><h2>About this opportunity</h2><p>{job.description}</p></section>
              <section className="details-section">
                <h2>What you&apos;ll need</h2>
                {job.requirements.length ? <ul className="requirements">{job.requirements.map((requirement) => <li key={requirement}><span aria-hidden="true">✓</span><span>{requirement}</span></li>)}</ul> : <p>Check the job description or contact the business for requirements.</p>}
              </section>

              {typeof job.match === "number" && <div className="match-panel"><div><strong>{job.match}% match for you</strong><p>A sample match score based on shift details and student-friendly requirements.</p></div><span aria-hidden="true" style={{ fontSize: "1.5rem" }}>✦</span></div>}

              <ApplyButton jobId={job.id} jobTitle={job.title} company={job.company} pay={job.pay} day={job.day} time={job.time} match={job.match ?? 0} college="College not added" course="Not specified" />
            </article>
          </div>
        </div>
      </main>
    </>
  );
}

export default function JobDetailsPage() {
  return (
    <RoleGuard requiredRole="student" allowPublic>
      <JobDetailsPageContent />
    </RoleGuard>
  );
}
