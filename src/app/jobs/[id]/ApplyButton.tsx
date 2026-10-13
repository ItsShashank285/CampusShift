"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccountRole } from "../../../lib/useAccountRole";

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
}: ApplyButtonProps) {
  const role = useAccountRole();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (role === "student") {
      setApplied(Boolean(localStorage.getItem(`application-${jobId}`)));
    } else {
      setApplied(false);
    }
  }, [jobId, role]);

  const handleApply = () => {
    // A UI guard, backed by the page-level role guard. Application storage is still
    // browser-local in this prototype; database-backed applications with RLS are a later milestone.
    if (role !== "student") return;

    const application = {
      jobId: String(jobId),
      job: jobTitle,
      jobTitle,
      company,
      pay,
      date: day,
      day,
      time,
      status: "Pending",
      studentName: "Student Applicant",
      college,
      course,
      experience: "Not provided",
      match,
      appliedAt: new Date().toISOString(),
    };

    localStorage.setItem(`application-${jobId}`, JSON.stringify(application));
    setApplied(true);
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

  if (applied) {
    return (
      <>
        <div className="apply-success" role="status">✓ Application saved — check your dashboard for its status.</div>
        <div className="hero-actions" style={{ marginTop: 12 }}>
          <Link href="/dashboard" className="btn btn-primary">Student dashboard <span aria-hidden="true">→</span></Link>
          <Link href="/jobs" className="btn btn-secondary">Explore more jobs</Link>
        </div>
      </>
    );
  }

  return (
    <button onClick={handleApply} className="btn btn-primary" style={{ width: "100%", minHeight: 54, marginTop: 28, fontSize: "1rem" }}>
      Apply for this job <span aria-hidden="true">→</span>
    </button>
  );
}
