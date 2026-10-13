"use client";

import type { CSSProperties } from "react";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { jobs as demoJobs } from "./jobs";
import { databaseRowToJob, type DatabaseJobRow, type JobListing } from "../../lib/jobs";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase/client";
import RoleGuard from "../components/RoleGuard";

function JobsPageContent() {
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseConfigured();
  const [databaseJobs, setDatabaseJobs] = useState<JobListing[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState("");
  const allJobs: JobListing[] = useMemo(() => [
    ...databaseJobs,
    ...demoJobs.map((job) => ({ ...job, source: "demo" as const })),
  ], [databaseJobs]);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("All work modes");
  const [shiftType, setShiftType] = useState("All shifts");
  const [category, setCategory] = useState("All categories");
  const [sortBy, setSortBy] = useState("Best match");

  useEffect(() => {
    let cancelled = false;
    async function loadPublishedJobs() {
      if (!supabase) {
        setDatabaseLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setDatabaseError(error.message);
      } else {
        setDatabaseJobs(((data || []) as DatabaseJobRow[]).map(databaseRowToJob));
      }
      setDatabaseLoading(false);
    }
    void loadPublishedJobs();
    return () => { cancelled = true; };
  }, [supabase]);

  const filteredJobs = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const matchingJobs = allJobs.filter((job) => {
      const matchesSearch =
        !searchText ||
        job.title.toLowerCase().includes(searchText) ||
        job.company.toLowerCase().includes(searchText) ||
        job.description.toLowerCase().includes(searchText) ||
        job.category.toLowerCase().includes(searchText);
      const matchesMode = workMode === "All work modes" || job.workMode === workMode;
      const matchesShift = shiftType === "All shifts" || job.shiftType === shiftType;
      const matchesCategory = category === "All categories" || job.category === category;
      return matchesSearch && matchesMode && matchesShift && matchesCategory;
    });

    return [...matchingJobs].sort((a, b) => {
      if (sortBy === "Highest pay") return b.pay - a.pay;
      if (sortBy === "Closest") return Number.parseFloat(a.distance || "999999") - Number.parseFloat(b.distance || "999999");
      return (b.match ?? -1) - (a.match ?? -1);
    });
  }, [allJobs, search, workMode, shiftType, category, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setWorkMode("All work modes");
    setShiftType("All shifts");
    setCategory("All categories");
    setSortBy("Best match");
  };

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          <div className="animate-in">
            <p className="eyebrow"><span className="eyebrow-dot" /> OPPORTUNITIES AROUND YOU</p>
            <h1 className="page-title">Find work that fits<br className="hidden sm:block" /> your <span className="gradient-text">schedule.</span></h1>
            <p className="page-description">Explore flexible student-friendly roles, compare pay upfront, and find a shift that works around your classes.</p>
          </div>

          {!configured && <div className="notice-card notice-info jobs-data-note"><strong>Preview mode</strong><p>The cards marked “Sample listing” are demo jobs. Add Supabase settings to load listings published by real business accounts.</p></div>}
          {databaseError && <div className="notice-card notice-error jobs-data-note" role="alert">Live listings couldn't be loaded: {databaseError}. Check the Supabase table setup.</div>}

          <section className="search-panel animate-in" style={{ "--delay": "100ms" } as CSSProperties} aria-label="Search and filter jobs">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input className="search-input" type="search" placeholder="Search jobs, companies or categories..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search jobs, companies or categories" />
            </label>
            <label className="search-field">
              <span aria-hidden="true">⌖</span>
              <select className="search-select" aria-label="Filter by work mode" value={workMode} onChange={(event) => setWorkMode(event.target.value)}>
                <option>All work modes</option><option>On-site</option><option>Remote</option><option>Hybrid</option>
              </select>
            </label>
            <label className="search-field">
              <span aria-hidden="true">◷</span>
              <select className="search-select" aria-label="Filter by shift" value={shiftType} onChange={(event) => setShiftType(event.target.value)}>
                <option>All shifts</option><option>Weekday</option><option>Weekend</option>
              </select>
            </label>
            <button className="btn btn-primary search-submit" type="button" onClick={() => setSearch(search.trim())}>Search jobs <span aria-hidden="true">→</span></button>
          </section>

          <div className="filter-row" aria-label="Quick filters">
            {["All categories", "Hospitality", "Retail", "Operations", "Creative", "Tutoring", "Events", "Delivery", "Other"].map((item) => (
              <button key={item} type="button" className={`filter-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)} aria-pressed={category === item}>{item === "All categories" ? "✦ All jobs" : item}</button>
            ))}
            <span style={{ flex: 1 }} />
            <label className="small-muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Sort by
              <select className="search-select" style={{ width: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px" }} value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort jobs">
                <option>Best match</option><option>Highest pay</option><option>Closest</option>
              </select>
            </label>
          </div>

          <div className="results-row">
            <h2>Curated for your next move</h2>
            <span className="results-count">{databaseLoading ? "Loading live jobs… · " : ""}{filteredJobs.length} {filteredJobs.length === 1 ? "opportunity" : "opportunities"}</span>
          </div>

          {filteredJobs.length ? (
            <div className="job-grid">
              {filteredJobs.map((job, index) => (
                <article key={job.id} className="job-card" style={{ "--delay": `${index * 90}ms` } as CSSProperties}>
                  <div className="job-top">
                    <div className="job-identity">
                      <div className="job-icon" aria-hidden="true">{job.icon}</div>
                      <div><h3 className="job-title">{job.title}</h3><p className="job-company">{job.company}</p></div>
                    </div>
                    {typeof job.match === "number" ? <span className="match-badge">{job.match}% match</span> : <span className="match-badge">New listing</span>}
                  </div>
                  <div className="job-badges"><span className="soft-badge">{job.source === "database" ? "Published" : "Sample listing"}</span><span className="soft-badge">{job.category}</span><span className="soft-badge">{job.workMode}</span><span className="soft-badge">{job.shiftType}</span></div>
                  <div className="job-info-grid">
                    <div className="info-tile"><p className="info-label">Hourly pay</p><p className="info-value">₹{job.pay}/hr</p></div>
                    <div className="info-tile"><p className="info-label">{job.location ? "Location" : "Distance"}</p><p className="info-value">{job.location || job.distance || "Not specified"}</p></div>
                    <div className="info-tile"><p className="info-label">Shift day</p><p className="info-value">{job.day}</p></div>
                    <div className="info-tile"><p className="info-label">Hours</p><p className="info-value">{job.time}</p></div>
                  </div>
                  <p className="job-description">{job.description}</p>
                  <div className="job-card-footer">
                    <div className="job-pay">₹{job.pay}<small> / hour</small></div>
                    <Link href={`/jobs/${job.id}`} className="btn btn-primary">View details <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state animate-in">
              <div className="empty-icon" aria-hidden="true">⌕</div>
              <h3>No jobs match those filters</h3>
              <p>Try another keyword or clear the filters to explore all current opportunities.</p>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 20 }} onClick={resetFilters}>Clear all filters</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function JobsPage() {
  return (
    <RoleGuard requiredRole="student" allowPublic>
      <JobsPageContent />
    </RoleGuard>
  );
}
