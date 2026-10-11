"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import Navbar from "../components/Navbar";
import { jobs } from "../jobs/jobs";

type Application = {
  jobId: string;
  status: string;
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const savedApplications: Application[] = [];

    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("application-")) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        const data: Partial<Application> = JSON.parse(value);
        const jobId = String(data.jobId || key.replace("application-", ""));
        const jobExists = jobs.some((job) => job.id === jobId);
        if (!jobExists) {
          localStorage.removeItem(key);
          index--;
          continue;
        }
        savedApplications.push({ jobId, status: data.status || "Pending" });
      } catch {
        localStorage.removeItem(key);
        index--;
      }
    }

    setApplications(savedApplications);
  }, []);

  const acceptedCount = applications.filter((application) => application.status === "Accepted").length;
  const pendingCount = applications.filter((application) => application.status === "Pending").length;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <div className="dashboard-header animate-in">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> YOUR STUDENT SPACE</p>
              <h1 className="page-title">Welcome back, <span className="gradient-text">Shashank.</span></h1>
              <p className="page-description">Keep track of your applications and find the next opportunity that fits your schedule.</p>
            </div>
            <div className="dashboard-user"><div className="avatar">S</div><div><strong>Student profile</strong><div className="small-muted" style={{ marginTop: 3 }}>Verified student</div></div></div>
          </div>

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

            {applications.length === 0 ? (
              <div className="empty-state animate-in">
                <div className="empty-icon" aria-hidden="true">✦</div>
                <h3>Your next opportunity is out there.</h3>
                <p>You haven&apos;t applied to any roles yet. Explore flexible shifts and save your first application here.</p>
                <Link href="/jobs" className="btn btn-primary" style={{ marginTop: 21 }}>Explore student jobs <span aria-hidden="true">→</span></Link>
              </div>
            ) : (
              <div className="application-list">
                {applications.map((application, index) => {
                  const job = jobs.find((item) => item.id === application.jobId);
                  if (!job) return null;
                  const statusClass = application.status === "Accepted" ? "status-accepted" : application.status === "Rejected" ? "status-rejected" : "";
                  return (
                    <article key={`${application.jobId}-${index}`} className="application-card" style={{ "--delay": `${index * 85}ms` } as CSSProperties}>
                      <div className="application-main">
                        <div className="application-identity">
                          <div className="job-icon" aria-hidden="true">{job.icon}</div>
                          <div><h3 className="application-title">{job.title}</h3><p className="application-subtitle">{job.company} · {job.category}</p></div>
                        </div>
                        <span className={`status-pill ${statusClass}`}>{application.status || "Pending"}</span>
                      </div>
                      <div className="application-meta">
                        <div className="info-tile"><p className="info-label">Hourly pay</p><p className="info-value">₹{job.pay}/hr</p></div>
                        <div className="info-tile"><p className="info-label">Shift day</p><p className="info-value">{job.day}</p></div>
                        <div className="info-tile"><p className="info-label">Hours</p><p className="info-value">{job.time}</p></div>
                      </div>
                      <div className="action-row"><Link href={`/jobs/${job.id}`} className="btn btn-quiet">View job details ↗</Link><span className="small-muted" style={{ alignSelf: "center" }}>Keep checking back for updates.</span></div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dashboard-section panel">
            <div className="panel-header">
              <div><p className="eyebrow"><span className="eyebrow-dot" /> PROFILE SNAPSHOT</p><h2 className="section-title" style={{ marginTop: 9 }}>Your profile</h2><p className="small-muted" style={{ marginTop: 9 }}>A complete profile can help businesses understand your fit.</p></div>
              <span className="soft-badge">Profile preview</span>
            </div>
            <div className="profile-grid">
              <div className="profile-cell"><div className="profile-label">College</div><div className="profile-value">VIT Vellore</div></div>
              <div className="profile-cell"><div className="profile-label">Course</div><div className="profile-value">B.Tech CSE</div></div>
              <div className="profile-cell"><div className="profile-label">Verification</div><div className="profile-value" style={{ color: "var(--green)" }}>✓ Verified student</div></div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
