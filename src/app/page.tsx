"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties as ReactCSSProperties } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { useAccountRole } from "../lib/useAccountRole";

const heroPhoto =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85";

const categories = [
  {
    icon: "☕",
    title: "Food & beverage",
    text: "Cafe, restaurant and hospitality shifts",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    count: "Hospitality",
  },
  {
    icon: "▣",
    title: "Retail",
    text: "Store, cashier and customer support roles",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    count: "Customer-facing",
  },
  {
    icon: "✦",
    title: "Events & campus",
    text: "One-off shifts, event crews and campus work",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    count: "Flexible shifts",
  },
  {
    icon: "⌘",
    title: "Tutoring & digital",
    text: "Tutoring, content, design and online work",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    count: "Skill-building",
  },
];

export default function Home() {
  const role = useAccountRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "business") router.replace("/business");
  }, [role, router]);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    if (!items.length) return;
    document.documentElement.classList.add("motion-enabled");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return () => document.documentElement.classList.remove("motion-enabled");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");
          observer.unobserve(target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-enabled");
    };
  }, []);

  if (role === "business") {
    return (
      <>
        <Navbar />
        <main className="page-shell"><div className="container narrow-container"><div className="empty-state" role="status"><p>Opening your business workspace…</p></div></div></main>
      </>
    );
  }

  if (role === "unknown") {
    return (
      <>
        <Navbar />
        <main className="page-shell"><div className="container narrow-container"><div className="notice-card notice-error"><strong>Couldn&apos;t verify your account role</strong><p>Please sign in again to open the correct CampusShift workspace.</p><Link href="/login" className="btn btn-primary" style={{ marginTop: 14 }}>Sign in again</Link></div></div></main>
      </>
    );
  }

  return (
    <main className="home-page">
      <Navbar />

      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy" data-scroll-reveal>
            <p className="eyebrow"><span className="eyebrow-dot" /> STUDENT-FIRST JOB MARKETPLACE</p>
            <h1 className="hero-title">
              Earn. Learn.<br />Grow. <span className="gradient-text">On your terms.</span>
            </h1>
            <p className="hero-description">
              Find part-time jobs, internships, and flexible shifts that fit around your classes — all from local businesses and opportunities that respect your time.
            </p>
            <div className="hero-actions">
              <Link href="/jobs" className="btn btn-primary">Find jobs <span aria-hidden="true">→</span></Link>
              {role === "student" ? (
                <Link href="/dashboard" className="btn btn-secondary">My dashboard <span aria-hidden="true">↗</span></Link>
              ) : (
                <Link href="/login?role=business" className="btn btn-secondary">For businesses <span aria-hidden="true">↗</span></Link>
              )}
            </div>
            <div className="hero-proof" aria-label="CampusShift benefits">
              <div className="hero-proof-item"><span className="proof-icon proof-icon-indigo">◷</span><span><strong>Flexible hours</strong><small>Work around classes</small></span></div>
              <div className="hero-proof-item"><span className="proof-icon proof-icon-sky">⌖</span><span><strong>Local opportunities</strong><small>Find work nearby</small></span></div>
              <div className="hero-proof-item"><span className="proof-icon proof-icon-amber">₹</span><span><strong>Pay upfront</strong><small>Know the rate first</small></span></div>
            </div>
          </div>

          <div className="hero-visual" data-scroll-reveal style={{ "--reveal-delay": "120ms" } as ReactCSSProperties}>
            <div className="hero-photo-backdrop" aria-hidden="true" />
            <div className="hero-photo-frame">
              <div className="hero-photo" role="img" aria-label="College students collaborating around a laptop" style={{ backgroundImage: `url("${heroPhoto}")` }}>
                <span className="hero-photo-label">MADE FOR STUDENT LIFE</span>
              </div>
            </div>
            <div className="hero-sticker hero-sticker-top"><span className="sticker-mark">✦</span><span><strong>Students first</strong><small>Your classes come first.</small></span></div>
            <div className="hero-sticker hero-sticker-bottom"><span className="sticker-mark sticker-mark-amber">₹</span><span><strong>Earn while you learn</strong><small>Clear pay. Flexible shifts.</small></span></div>
            <div className="hero-note" aria-hidden="true">YOUR NEXT<br />GOOD SHIFT <span>↗</span></div>
          </div>
        </div>
      </section>

      <section className="home-benefits" aria-label="CampusShift benefits">
        <div className="container benefits-grid">
          <div className="benefit-item" data-scroll-reveal><span className="benefit-mark benefit-mark-indigo">✓</span><div><strong>Built around your schedule</strong><p>Part-time and flexible shifts</p></div></div>
          <div className="benefit-item" data-scroll-reveal style={{ "--reveal-delay": "80ms" } as ReactCSSProperties}><span className="benefit-mark benefit-mark-teal">⌖</span><div><strong>Opportunities close to campus</strong><p>Local work, less searching</p></div></div>
          <div className="benefit-item" data-scroll-reveal style={{ "--reveal-delay": "160ms" } as ReactCSSProperties}><span className="benefit-mark benefit-mark-amber">₹</span><div><strong>Clear pay before you apply</strong><p>Know what a shift pays</p></div></div>
        </div>
      </section>

      <section className="home-section" id="how-it-works">
        <div className="container">
          <div className="section-heading" data-scroll-reveal>
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> FIND YOUR FIT</p>
              <h2 className="section-title">A good shift is closer than you think.</h2>
              <p className="section-intro">Explore the kinds of opportunities students use to earn, learn, and build experience.</p>
            </div>
            <Link href="/jobs" className="btn btn-secondary">Browse all jobs <span aria-hidden="true">→</span></Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link
                href="/jobs"
                className="category-card"
                key={category.title}
                data-scroll-reveal
                style={{ "--reveal-delay": `${index * 75}ms` } as ReactCSSProperties}
              >
                <div
                  className="category-photo"
                  role="img"
                  aria-label={`${category.title} opportunities`}
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(13, 24, 55, 0.03) 35%, rgba(13, 24, 55, 0.62) 100%), url("${category.image}")` }}
                >
                  <span className="category-photo-tag">{category.count}</span>
                </div>
                <div className="category-card-content">
                  <span className="category-icon" aria-hidden="true">{category.icon}</span>
                  <h3>{category.title}</h3>
                  <p>{category.text}</p>
                  <span className="category-arrow" aria-hidden="true">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-how-section">
        <div className="container how-grid">
          <div data-scroll-reveal>
            <p className="eyebrow"><span className="eyebrow-dot" /> FROM SEARCH TO SHIFT</p>
            <h2 className="section-title">Simple from the first click.</h2>
            <p className="section-intro">CampusShift keeps the details that matter close at hand, so you can spend less time searching and more time getting experience.</p>
            <Link href="/jobs" className="btn btn-primary">Explore opportunities <span aria-hidden="true">→</span></Link>
          </div>
          <div className="how-steps">
            <article className="how-step" data-scroll-reveal>
              <span className="how-step-number">01</span><div><h3>Find work that fits</h3><p>Search by job type, location, and the shifts that work with your timetable.</p></div>
            </article>
            <article className="how-step" data-scroll-reveal style={{ "--reveal-delay": "90ms" } as ReactCSSProperties}>
              <span className="how-step-number">02</span><div><h3>Know the details upfront</h3><p>Review hourly pay, work mode, and shift expectations before you apply.</p></div>
            </article>
            <article className="how-step" data-scroll-reveal style={{ "--reveal-delay": "180ms" } as ReactCSSProperties}>
              <span className="how-step-number">03</span><div><h3>Keep your next move in view</h3><p>Use your student dashboard to keep track of applications you&apos;ve saved.</p></div>
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner"><Link href="/" className="brand" aria-label="CampusShift home"><span className="brand-mark">CS</span><span className="brand-word">Campus<span className="brand-accent">Shift</span></span></Link><p>Flexible work for student life.</p><div className="footer-links"><Link href="/jobs">Find jobs</Link><Link href="/login?role=business">For businesses</Link></div></div>
      </footer>
    </main>
  );
}
