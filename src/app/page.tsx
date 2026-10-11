import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";

const categories = [
  { icon: "🍔", title: "Restaurant Crew", text: "Evening and weekend shifts" },
  { icon: "🛍️", title: "Retail & Cashier", text: "Customer-facing roles" },
  { icon: "📦", title: "Operations", text: "Flexible hands-on work" },
  { icon: "✦", title: "Creative & Digital", text: "Social, content and design" },
];

export default function Home() {
  return (
    <main>
      <Navbar />

      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy animate-in">
            <p className="eyebrow"><span className="eyebrow-dot" /> BUILT AROUND STUDENT LIFE</p>
            <h1 className="hero-title">
              Find flexible work<br />
              that fits your <span className="gradient-text">campus life.</span>
            </h1>
            <p className="hero-description">
              Discover part-time shifts, grow your experience, and earn on your schedule. CampusShift brings students and local businesses together for work that fits real life.
            </p>
            <div className="hero-actions">
              <Link href="/jobs" className="btn btn-primary">Explore student jobs <span aria-hidden="true">→</span></Link>
              <Link href="/business" className="btn btn-secondary">Hire student talent <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="trust-row" aria-label="CampusShift benefits">
              <span className="trust-item"><span className="trust-check">✓</span> Student-first opportunities</span>
              <span className="trust-item"><span className="trust-check">✓</span> Flexible shifts</span>
              <span className="trust-item"><span className="trust-check">✓</span> Clear pay upfront</span>
            </div>
          </div>

          <div className="hero-visual animate-in" style={{ "--delay": "150ms" } as CSSProperties}>
            <div className="hero-orb" aria-hidden="true" />
            <div className="preview-window">
              <div className="preview-topbar" aria-hidden="true">
                <span className="window-dot" /><span className="window-dot" /><span className="window-dot" />
                <span className="preview-url">campusshift.app / opportunities</span>
              </div>
              <div className="preview-content">
                <span className="preview-label">✦ MADE FOR YOUR NEXT MOVE</span>
                <h2 className="preview-title">Your skills.<br />Your schedule.<br /><span className="gradient-text">Your next opportunity.</span></h2>
                <p className="preview-text">Find student-friendly work with clear pay, flexible hours and room to grow.</p>
                <div className="preview-search"><span>⌕ &nbsp; Search jobs or companies...</span><span className="preview-search-cta">Search ↗</span></div>
                <div className="preview-chips"><span className="preview-chip">Part-time</span><span className="preview-chip">Weekend</span><span className="preview-chip">Flexible hours</span><span className="preview-chip">Near campus</span></div>
                <div className="preview-job">
                  <div className="preview-icon">🛒</div>
                  <div><div className="preview-job-name">Evening Cashier</div><div className="preview-job-meta">ABC Supermarket · 2.1 km away</div></div>
                  <div className="preview-pay">₹150<span className="muted">/hr</span></div>
                </div>
                <div className="preview-job">
                  <div className="preview-icon">✦</div>
                  <div><div className="preview-job-name">Social Media Assistant</div><div className="preview-job-meta">Campus Media · Flexible shift</div></div>
                  <div className="preview-pay">₹250<span className="muted">/hr</span></div>
                </div>
              </div>
            </div>
            <div className="floating-card floating-one">
              <span className="floating-avatar">✓</span><span><strong>Student-first</strong><small>Work around your classes</small></span>
            </div>
            <div className="floating-card floating-two">
              <span className="floating-avatar">₹</span><span><strong>Know your pay</strong><small>Before you apply</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-heading animate-in">
            <div><p className="eyebrow"><span className="eyebrow-dot" /> FIND YOUR FIT</p><h2 className="section-title">A shift for every kind of student.</h2></div>
            <Link href="/jobs" className="btn btn-secondary">Browse all jobs <span aria-hidden="true">→</span></Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link href="/jobs" className="category-card" key={category.title} style={{ "--delay": `${index * 80}ms` } as CSSProperties}>
                <div className="category-icon">{category.icon}</div><h3>{category.title}</h3><p>{category.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
