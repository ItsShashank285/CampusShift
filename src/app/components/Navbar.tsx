import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="CampusShift home">
          <span className="brand-mark">CS</span>
          <span className="brand-word">CampusShift</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/jobs" className="nav-link">Find Jobs</Link>
          <Link href="/dashboard" className="nav-link">Student Dashboard</Link>
          <Link href="/business" className="nav-link">For Businesses</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/login" className="btn btn-primary">Get Started <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
  );
}
