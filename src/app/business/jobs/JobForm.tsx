"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Navbar from "../../components/Navbar";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../../lib/supabase/client";
import type { DatabaseJobRow } from "../../../lib/jobs";

type JobFormState = {
  title: string;
  company: string;
  pay: string;
  location: string;
  shift_day: string;
  shift_time: string;
  category: string;
  work_mode: string;
  shift_type: string;
  description: string;
  requirements: string;
  workers_needed: string;
};

const emptyForm: JobFormState = {
  title: "",
  company: "",
  pay: "150",
  location: "",
  shift_day: "Flexible",
  shift_time: "5:00 PM – 9:00 PM",
  category: "Retail",
  work_mode: "On-site",
  shift_type: "Weekday",
  description: "",
  requirements: "College student\nGood communication skills\nReliable and punctual",
  workers_needed: "1",
};

type JobFormProps = { jobId?: string };

type AccessState = "loading" | "unconfigured" | "signed-out" | "not-business" | "profile-error" | "not-found" | "ready";

export default function JobForm({ jobId }: JobFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseConfigured();
  const [access, setAccess] = useState<AccessState>("loading");
  const [ownerId, setOwnerId] = useState("");
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [loadingJob, setLoadingJob] = useState(Boolean(jobId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function prepareForm() {
      if (!supabase || !configured) {
        setAccess("unconfigured");
        setLoadingJob(false);
        return;
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError || !sessionData.session) {
        setAccess("signed-out");
        setLoadingJob(false);
        return;
      }
      const user: User = sessionData.session.user;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setError(`Couldn't verify your account role: ${profileError.message}. Check that supabase/schema.sql has been run.`);
        setAccess("profile-error");
        setLoadingJob(false);
        return;
      }
      if (profile?.role !== "business") {
        setAccess("not-business");
        setLoadingJob(false);
        return;
      }
      setOwnerId(user.id);
      setAccess("ready");

      if (jobId) {
        const { data: row, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .eq("owner_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (jobError || !row) {
          setError(jobError?.message || "This job wasn't found in your business account.");
          setAccess("not-found");
        } else {
          const job = row as DatabaseJobRow;
          setForm({
            title: job.title,
            company: job.company,
            pay: String(job.pay),
            location: job.location,
            shift_day: job.shift_day,
            shift_time: job.shift_time,
            category: job.category,
            work_mode: job.work_mode,
            shift_type: job.shift_type,
            description: job.description,
            requirements: (job.requirements || []).join("\n"),
            workers_needed: String(job.workers_needed),
          });
        }
      }
      setLoadingJob(false);
    }
    void prepareForm();
    return () => { cancelled = true; };
  }, [configured, jobId, supabase]);

  const updateField = (field: keyof JobFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase || !ownerId) {
      setError("Your business session could not be verified. Please sign in again.");
      return;
    }

    const requirements = form.requirements
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      pay: Number(form.pay),
      location: form.location.trim(),
      shift_day: form.shift_day,
      shift_time: form.shift_time.trim(),
      category: form.category,
      work_mode: form.work_mode,
      shift_type: form.shift_type,
      description: form.description.trim(),
      requirements,
      workers_needed: Number(form.workers_needed),
    };

    if (!Number.isFinite(payload.pay) || payload.pay < 0 || !Number.isInteger(payload.workers_needed) || payload.workers_needed < 1) {
      setError("Enter a valid hourly pay and a whole number of workers (at least 1).");
      return;
    }

    setSubmitting(true);
    try {
      if (jobId) {
        const { error: updateError } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", jobId)
          .eq("owner_id", ownerId)
          .select("id")
          .single();
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("jobs")
          .insert({ ...payload, owner_id: ownerId, status: "active" })
          .select("id")
          .single();
        if (insertError) throw insertError;
      }
      router.push("/business?notice=job-saved");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save this job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container narrow-container">
          <Link href="/business" className="breadcrumb"><span aria-hidden="true">←</span> Back to business dashboard</Link>
          <div className="form-page-heading animate-in">
            <p className="eyebrow"><span className="eyebrow-dot" /> BUSINESS WORKSPACE</p>
            <h1 className="page-title">{jobId ? "Edit your " : "Post a new "}<span className="gradient-text">job opening.</span></h1>
            <p className="page-description">Make the shift details clear so students can quickly decide whether the opportunity fits their schedule.</p>
          </div>

          {access === "unconfigured" && <div className="notice-card notice-warning"><strong>Connect Supabase first</strong><p>Complete <code>SUPABASE_SETUP.md</code> before publishing shared job listings.</p></div>}
          {access === "signed-out" && <div className="empty-state"><h2>Sign in as a business</h2><p>You need a business account to publish or edit a listing.</p><Link className="btn btn-primary" href="/login?role=business" style={{ marginTop: 18 }}>Sign in <span aria-hidden="true">→</span></Link></div>}
          {access === "not-business" && <div className="empty-state"><h2>Business account required</h2><p>This account doesn't have the business role needed to manage listings.</p><Link className="btn btn-primary" href="/login?role=business&mode=signup" style={{ marginTop: 18 }}>Create a business account</Link></div>}
          {access === "profile-error" && <div className="empty-state"><h2>Couldn't verify your business profile</h2><p>{error}</p></div>}
          {access === "not-found" && <div className="empty-state"><h2>Couldn't open this listing</h2><p>{error || "This job wasn't found in your business account."}</p><Link className="btn btn-secondary" href="/business" style={{ marginTop: 18 }}>Back to dashboard</Link></div>}
          {access === "loading" && <div className="empty-state"><p>Checking your account…</p></div>}

          {access === "ready" && (loadingJob ? <div className="empty-state"><p>Loading your job details…</p></div> : (
            <form className="job-form glass-panel animate-in" onSubmit={handleSubmit}>
              <div className="form-section-heading"><span className="step-number">1</span><div><h2>Basic information</h2><p>What is the role and which business is hiring?</p></div></div>
              <div className="form-grid">
                <label className="form-field"><span>Job title *</span><input required minLength={3} maxLength={120} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="e.g. Evening cashier" /></label>
                <label className="form-field"><span>Business or company name *</span><input required minLength={2} maxLength={120} value={form.company} onChange={(event) => updateField("company", event.target.value)} placeholder="e.g. ABC Supermarket" /></label>
                <label className="form-field"><span>Hourly pay (₹) *</span><input required type="number" min="0" step="0.5" value={form.pay} onChange={(event) => updateField("pay", event.target.value)} /></label>
                <label className="form-field"><span>Work location *</span><input required minLength={2} maxLength={160} value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="e.g. Vellore, Tamil Nadu" /></label>
              </div>

              <div className="form-section-heading"><span className="step-number">2</span><div><h2>Shift and work type</h2><p>Help students understand when and where they'll work.</p></div></div>
              <div className="form-grid">
                <label className="form-field"><span>Shift day *</span><select required value={form.shift_day} onChange={(event) => updateField("shift_day", event.target.value)}><option>Flexible</option><option>Any day</option><option>Monday–Friday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></label>
                <label className="form-field"><span>Shift timing *</span><input required maxLength={100} value={form.shift_time} onChange={(event) => updateField("shift_time", event.target.value)} placeholder="e.g. 5:00 PM – 9:00 PM" /></label>
                <label className="form-field"><span>Category *</span><select required value={form.category} onChange={(event) => updateField("category", event.target.value)}><option>Retail</option><option>Hospitality</option><option>Operations</option><option>Creative</option><option>Tutoring</option><option>Events</option><option>Delivery</option><option>Other</option></select></label>
                <label className="form-field"><span>Work mode *</span><select required value={form.work_mode} onChange={(event) => updateField("work_mode", event.target.value)}><option>On-site</option><option>Remote</option><option>Hybrid</option></select></label>
                <label className="form-field"><span>Shift type *</span><select required value={form.shift_type} onChange={(event) => updateField("shift_type", event.target.value)}><option>Weekday</option><option>Weekend</option><option>Flexible</option></select></label>
                <label className="form-field"><span>Number of workers needed *</span><input required type="number" min="1" max="100" step="1" value={form.workers_needed} onChange={(event) => updateField("workers_needed", event.target.value)} /></label>
              </div>

              <div className="form-section-heading"><span className="step-number">3</span><div><h2>Describe the opportunity</h2><p>Explain the work and list what applicants should bring.</p></div></div>
              <div className="form-stack">
                <label className="form-field"><span>Job description * <small>20–3000 characters</small></span><textarea required minLength={20} maxLength={3000} rows={5} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe the main responsibilities, work environment and expectations…" /></label>
                <label className="form-field"><span>Requirements <small>One requirement per line</small></span><textarea rows={4} value={form.requirements} onChange={(event) => updateField("requirements", event.target.value)} placeholder="College student\nGood communication skills\nReliable and punctual" /></label>
              </div>

              {error && <div className="notice-card notice-error" role="alert">{error}</div>}
              <div className="form-footer"><p className="form-help">Your listing will be published as <strong>Active</strong> and can be closed from your dashboard later.</p><div className="hero-actions"><Link href="/business" className="btn btn-secondary">Cancel</Link><button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Saving…" : jobId ? "Save changes" : "Publish job"} <span aria-hidden="true">→</span></button></div></div>
            </form>
          ))}
        </div>
      </main>
    </>
  );
}
