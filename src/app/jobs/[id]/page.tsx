import Link from "next/link";
import Navbar from "../../components/Navbar";
import { jobs } from "../jobs";
import ApplyButton from "./ApplyButton";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="container empty-state">
            <div className="empty-icon" aria-hidden="true">⌕</div>
            <h1 className="page-title" style={{ fontSize: "2rem" }}>We couldn&apos;t find that job.</h1>
            <p>This opportunity may have been removed or the link may be incorrect.</p>
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
                <span className="match-badge">{job.match}% match</span>
              </div>

              <div className="job-badges" style={{ marginTop: 25 }}>
                <span className="soft-badge">Student friendly</span>
                <span className="soft-badge">{job.workMode}</span>
                <span className="soft-badge">{job.shiftType}</span>
                <span className="soft-badge">Flexible shift</span>
              </div>

              <div className="details-grid">
                <div className="info-tile"><p className="info-label">Hourly pay</p><p className="info-value">₹{job.pay}/hr</p></div>
                <div className="info-tile"><p className="info-label">Distance</p><p className="info-value">{job.distance}</p></div>
                <div className="info-tile"><p className="info-label">Shift day</p><p className="info-value">{job.day}</p></div>
                <div className="info-tile"><p className="info-label">Hours</p><p className="info-value">{job.time}</p></div>
              </div>

              <section className="details-section">
                <h2>About this opportunity</h2>
                <p>{job.description}</p>
              </section>

              <section className="details-section">
                <h2>What you&apos;ll need</h2>
                <ul className="requirements">
                  {job.requirements.map((requirement) => (
                    <li key={requirement}><span aria-hidden="true">✓</span><span>{requirement}</span></li>
                  ))}
                </ul>
              </section>

              <div className="match-panel">
                <div><strong>{job.match}% match for you</strong><p>A strong match based on the shift details and student-friendly requirements.</p></div>
                <span aria-hidden="true" style={{ fontSize: "1.5rem" }}>✦</span>
              </div>

              <ApplyButton
                jobId={job.id}
                jobTitle={job.title}
                company={job.company}
                pay={job.pay}
                day={job.day}
                time={job.time}
                match={job.match}
                college="College not added"
                course="Not specified"
              />
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
