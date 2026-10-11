"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setApplied(Boolean(localStorage.getItem(`application-${jobId}`)));
  }, [jobId]);

  const handleApply = () => {
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
      // These fields are placeholders until a profile form is connected.
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
