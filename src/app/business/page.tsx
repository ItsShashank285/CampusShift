"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import Navbar from "../components/Navbar";
import { jobs } from "../jobs/jobs";

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

export default function BusinessPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const savedApplications: Application[] = [];

    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("application-")) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        const data = JSON.parse(value) as Partial<Application> & { jobTitle?: string; day?: string };
        const jobId = String(data.jobId || key.replace("application-", ""));
        const knownJob = jobs.find((item) => item.id === jobId);
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
        // Ignore any corrupt older localStorage entries rather than crashing the page.
      }
    }

    setApplications(savedApplications);
  }, []);

  const handleStatusChange = (jobId: string, newStatus: string) => {
    const updatedApplications = applications.map((application) =>
      application.jobId === jobId ? { ...application, status: newStatus } : application
    );
    setApplications(updatedApplications);

    const updatedApplication = updatedApplications.find((application) => application.jobId === jobId);
    if (updatedApplication) {
      localStorage.setItem(`application-${jobId}`, JSON.stringify(updatedApplication));
    }
  };

  const pendingCount = applications.filter((application) => application.status === "Pending").length;
  const acceptedCount = applications.filter((application) => application.status === "Accepted").length;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <div className="dashboard-header animate-in">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> BUSINESS WORKSPACE</p>
              <h1 className="page-title">Build your team with <span className="gradient-text">student talent.</span></h1>
              <p className="page-description">Review applicants, manage your open shifts, and find reliable people to support your business.</p>
            </div>
            <div className="dashboard-user"><div className="avatar">A</div><div><strong>ABC Supermarket</strong><div className="small-muted" style={{ marginTop: 3 }}>Business account</div></div></div>
          </div>

          <section className="dashboard-stats" aria-label="Business overview">
            <div className="stat-card" style={{ "--delay": "60ms" } as CSSProperties}><div className="stat-label">Active jobs</div><div className="stat-value">2</div><div className="stat-footnote">Your current opportunities</div></div>
            <div className="stat-card" style={{ "--delay": "140ms" } as CSSProperties}><div className="stat-label">Pending applications</div><div className="stat-value">{pendingCount}</div><div className="stat-footnote">Ready for your review</div></div>
            <div className="stat-card" style={{ "--delay": "220ms" } as CSSProperties}><div className="stat-label">Accepted applicants</div><div className="stat-value">{acceptedCount}</div><div className="stat-footnote">Students you have accepted</div></div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div><p className="eyebrow"><span className="eyebrow-dot" /> OPEN OPPORTUNITIES</p><h2 className="section-title">Your jobs</h2></div>
              <Link href="/jobs" className="btn btn-primary">View job listings <span aria-hidden="true">→</span></Link>
            </div>

            <article className="panel business-job-layout">
              <div>
                <div className="panel-header">
                  <div><span className="soft-badge">Retail · On-site</span><h3 className="panel-title" style={{ marginTop: 13, fontSize: "1.35rem" }}>Evening Cashier</h3><p className="small-muted" style={{ marginTop: 7 }}>Friday · 6:00 PM – 10:00 PM</p></div>
                  <span className="status-pill status-accepted">Active</span>
                </div>
                <div className="business-job-details"><span>₹150 / hour</span><span>⌖ 2.1 km</span><span>♧ 2 workers needed</span></div>
              </div>
              <div className="business-job-aside"><span className="small-muted">Applications received</span><strong>{applications.length}</strong><span className="small-muted" style={{ marginTop: 7 }}>For this local prototype</span></div>
            </article>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div><p className="eyebrow"><span className="eyebrow-dot" /> CANDIDATE PIPELINE</p><h2 className="section-title">Student applications</h2></div>
              <span className="soft-badge">{applications.length} total</span>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state animate-in">
                <div className="empty-icon" aria-hidden="true">♧</div>
                <h3>Your next great teammate could be here.</h3>
                <p>When a student applies for one of the available roles, their application will appear here for your review.</p>
                <Link href="/jobs" className="btn btn-secondary" style={{ marginTop: 21 }}>Preview available jobs <span aria-hidden="true">→</span></Link>
              </div>
            ) : (
              <div className="application-list">
                {applications.map((application, index) => {
                  const statusClass = application.status === "Accepted" ? "status-accepted" : application.status === "Rejected" ? "status-rejected" : "";
                  const initial = application.studentName?.trim().charAt(0) || "S";
                  return (
                    <article key={`${application.jobId}-${index}`} className="application-card" style={{ "--delay": `${index * 75}ms` } as CSSProperties}>
                      <div className="application-main">
                        <div className="application-identity">
                          <div className="avatar avatar-large">{initial.toUpperCase()}</div>
                          <div><h3 className="application-title">{application.studentName || "Student Applicant"}</h3><p className="application-subtitle">{application.college || "College not added"}</p></div>
                        </div>
                        <span className={`status-pill ${statusClass}`}>{application.status || "Pending"}</span>
                      </div>

                      <div style={{ marginTop: 22 }}><p className="info-label">APPLIED FOR</p><h4 className="panel-title" style={{ marginTop: 7 }}>{application.job || "Job application"}</h4><p className="small-muted" style={{ marginTop: 5 }}>{application.company || "Company not listed"}</p></div>

                      <div className="application-meta">
                        <div className="info-tile"><p className="info-label">Course</p><p className="info-value">{application.course || "Not specified"}</p></div>
                        <div className="info-tile"><p className="info-label">Experience</p><p className="info-value">{application.experience || "Not provided"}</p></div>
                        <div className="info-tile"><p className="info-label">Match</p><p className="info-value">{application.match || 0}%</p></div>
                      </div>

                      <div className="business-job-details"><span>₹{application.pay ?? "—"} / hour</span><span>◷ {application.date || "Not specified"}</span><span>◷ {application.time || "Not specified"}</span></div>

                      {application.status === "Pending" && (
                        <div className="action-row">
                          <button type="button" onClick={() => handleStatusChange(application.jobId, "Accepted")} className="btn btn-primary">Accept applicant <span aria-hidden="true">✓</span></button>
                          <button type="button" onClick={() => handleStatusChange(application.jobId, "Rejected")} className="btn btn-danger">Decline</button>
                        </div>
                      )}
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
