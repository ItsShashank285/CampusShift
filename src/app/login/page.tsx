import type { CSSProperties } from "react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <div className="container">
        <div style={{ textAlign: "center" }} className="animate-in">
          <Link href="/" className="brand" style={{ justifyContent: "center" }}>
            <span className="brand-mark">CS</span><span className="brand-word">CampusShift</span>
          </Link>
        </div>

        <div className="login-heading animate-in" style={{ "--delay": "100ms" } as CSSProperties}>
          <p className="eyebrow" style={{ justifyContent: "center" }}><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</p>
          <h1 className="page-title">Welcome to <span className="gradient-text">CampusShift.</span></h1>
          <p className="page-description">Choose your workspace and get moving. One platform, opportunities for students and businesses.</p>
        </div>

        <div className="portal-grid">
          <Link href="/dashboard" className="portal-card animate-in" style={{ "--delay": "170ms" } as CSSProperties}>
            <div className="portal-icon">🎓</div>
            <h2>I&apos;m a student</h2>
            <p>Discover flexible part-time jobs, apply for shifts, follow your applications and keep your work organized around college.</p>
            <span className="portal-link">Enter student portal <span aria-hidden="true">→</span></span>
          </Link>
          <Link href="/business" className="portal-card animate-in" style={{ "--delay": "260ms" } as CSSProperties}>
            <div className="portal-icon">✦</div>
            <h2>I&apos;m a business</h2>
            <p>Reach motivated student workers, review applications and choose people for flexible shifts and entry-level roles.</p>
            <span className="portal-link">Enter business portal <span aria-hidden="true">→</span></span>
          </Link>
        </div>
        <Link href="/" className="back-link">← Back to CampusShift</Link>
      </div>
    </main>
  );
}
