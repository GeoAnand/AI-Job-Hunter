import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthPage from "./pages/AuthPage";
import "./App.css";
import {
  Activity, ArrowDownUp, ArrowRight, Bell, BriefcaseBusiness,
  Building2, Check, ChevronDown, CircleHelp, Clock3, FileText,
  Filter, Globe2, LayoutDashboard, MapPin, Menu, Plus,
  Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles,
  Target, Upload, X, Bookmark, ExternalLink, RefreshCw,
  Send, Trash2, UserRound, Zap, LogOut
} from "lucide-react";


type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  description?: string;
  url?: string;
  postedAt?: string;
  matchScore?: number;
};

type Application = Job & {
  status: string;
  appliedAt: string;
};

const PORTALS = ["LinkedIn", "Indeed", "Naukri", "SEEK", "Glassdoor", "Foundit"];
const API = "http://localhost:5000";

function readStorage<T,>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  // logut user on page unload
  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    notify(error.message);
    return;
  }

  setPage("Overview");
  notify("You have been signed out.");
};
// end

  const [session, setSession] = useState<Session | null>(null);
const [authLoading, setAuthLoading] = useState(true);
const [dataLoaded, setDataLoaded] = useState(false);

const user = session?.user;
const userId = user?.id;

const userName =
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "My workspace";

const userEmail = user?.email || "";
const userInitial = userName.charAt(0).toUpperCase();
  const [page, setPage] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
const [applications, setApplications] = useState<Application[]>([]);
const [portals, setPortals] = useState<string[]>(PORTALS);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [region, setRegion] = useState("India");
  const [postedWithin, setPostedWithin] = useState("7");
  const [selectedSource, setSelectedSource] = useState("All portals");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searched, setSearched] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [notice, setNotice] = useState("");

  
useEffect(() => {
  if (!userId) {
    setDataLoaded(false);
    return;
  }

  setSavedJobs(readStorage(`jh_${userId}_saved`, []));
  setApplications(readStorage(`jh_${userId}_applications`, []));
  setPortals(readStorage(`jh_${userId}_portals`, PORTALS));
  setResumeName(
    localStorage.getItem(`jh_${userId}_resume_name`) || ""
  );

  setDataLoaded(true);
}, [userId]);


useEffect(() => {
  if (!userId || !dataLoaded) return;
  localStorage.setItem(`jh_${userId}_saved`, JSON.stringify(savedJobs));
}, [userId, dataLoaded, savedJobs]);

useEffect(() => {
  if (!userId || !dataLoaded) return;
  localStorage.setItem(`jh_${userId}_applications`, JSON.stringify(applications));
}, [userId, dataLoaded, applications]);

useEffect(() => {
  if (!userId || !dataLoaded) return;
  localStorage.setItem(`jh_${userId}_portals`, JSON.stringify(portals));
}, [userId, dataLoaded, portals]);

useEffect(() => {
  if (!userId || !dataLoaded) return;

  if (resumeName) {
    localStorage.setItem(`jh_${userId}_resume_name`, resumeName);
  } else {
    localStorage.removeItem(`jh_${userId}_resume_name`);
  }
}, [userId, dataLoaded, resumeName]);

  

useEffect(() => {
  let mounted = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, newSession) => {
    if (!mounted) return;

    // Do not reset dashboard loading when Supabase
    // detects an existing session or refreshes a token.
    console.log("Auth event:", event);

    setSession(newSession);
    setAuthLoading(false);
  });

  supabase.auth.getSession().then(({ data, error }) => {
    if (!mounted) return;

    if (error) {
      console.error("Session error:", error.message);
    }

    setSession(data.session);
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);



  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const runSearch = async () => {
    if (!query.trim()) {
      notify("Enter a job title or keyword to search.");
      return;
    }

    setPage("Discover jobs");
    setLoading(true);
    setSearched(true);
    setApiError("");

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        location,
        region,
        postedWithin,
        source: selectedSource
      });

      const response = await fetch(`${API}/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const data = await response.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch {
      setJobs([]);
      setApiError("Could not connect to the job-search service. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSaved = (job: Job) => {
    const exists = savedJobs.some((item) => item.id === job.id);
    setSavedJobs((current) =>
      exists ? current.filter((item) => item.id !== job.id) : [...current, job]
    );
    notify(exists ? "Job removed from saved jobs." : "Job saved successfully.");
  };

  const isSaved = (job: Job) => savedJobs.some((item) => item.id === job.id);

  const addApplication = (job: Job) => {
    if (applications.some((item) => item.id === job.id)) {
      notify("This job is already in your application tracker.");
      return;
    }

    setApplications((current) => [
      { ...job, status: "Interested", appliedAt: new Date().toISOString() },
      ...current
    ]);
    notify("Added to your application tracker. Review before applying.");
  };

  const updateApplication = (id: string, status: string) => {
    setApplications((current) =>
      current.map((item) => item.id === id ? { ...item, status } : item)
    );
  };

  const removeApplication = (id: string) => {
    setApplications((current) => current.filter((item) => item.id !== id));
    notify("Application entry removed.");
  };

  const handleResume = (file?: File) => {
    if (!file) return;
    const allowed = [".pdf", ".doc", ".docx"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      notify("Please select a PDF, DOC or DOCX resume.");
      return;
    }
    setResumeName("");
localStorage.removeItem("jh_resume_name");
notify("Resume selection cleared.");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Discover jobs", icon: Search },
    { name: "Saved jobs", icon: Bookmark },
    { name: "Applications", icon: BriefcaseBusiness },
    { name: "My resume", icon: FileText },
    { name: "Settings", icon: Settings }
  ];

  const counts = useMemo(() => ({
    discovered: jobs.length,
    saved: savedJobs.length,
    applications: applications.length,
    pending: applications.filter((item) =>
      ["Interested", "Ready for review"].includes(item.status)
    ).length
  }), [jobs, savedJobs, applications]);

  const changePage = (name: string) => {
    setPage(name);
    setMobileMenu(false);
  };

  const openJob = (job: Job) => {
    if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
    else notify("An original job link has not been supplied for this listing.");
  };

  const JobCard = ({ job }: { job: Job }) => (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-mark">
          {(job.company || "J").slice(0, 1).toUpperCase()}
        </div>
        <div className="job-main">
          <h3>{job.title}</h3>
          <div className="job-company">{job.company || "Company not provided"}</div>
        </div>
        <button className={`icon-button ${isSaved(job) ? "is-saved" : ""}`}
          title="Save job" onClick={() => toggleSaved(job)}>
          <Bookmark size={18} />
        </button>
      </div>
      <div className="job-meta">
        <span><MapPin size={14} />{job.location || "Location not provided"}</span>
        <span><Building2 size={14} />{job.source || "Source unavailable"}</span>
        {job.postedAt && <span><Clock3 size={14} />{job.postedAt}</span>}
      </div>
      {job.description && <p className="job-description">{job.description}</p>}
      <div className="job-card-bottom">
        <span className="match-label">
          <Sparkles size={14} /> {job.matchScore != null ? `${job.matchScore}% match` : "Match analysis pending"}
        </span>
        <div className="job-actions">
          <button className="button button-light button-small" onClick={() => addApplication(job)}>
            <Plus size={14} /> Track job
          </button>
          <button className="button button-primary button-small" onClick={() => openJob(job)}>
            View original <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </article>
  );

  if (authLoading || (userId && !dataLoaded)) {
  return (
    <div className="auth-loading">
      <div className="auth-loading-logo">✦</div>
      <h2>TalentPilot</h2>
      <p>Preparing your workspace...</p>
    </div>
  );
}

if (!session) {
  return <AuthPage />;
}

return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-overlay" onClick={() => setMobileMenu(false)} aria-label="Close menu" />}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol"><Zap size={21} fill="currentColor" /></div>
          <div><strong>TalentPilot</strong><span>AI JOB HUNTER</span></div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)}><X /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.name}
                className={`nav-item ${page === item.name ? "nav-active" : ""}`}
                onClick={() => changePage(item.name)}>
                <Icon size={18} />
                <span>{item.name}</span>
                {item.name === "Applications" && applications.length > 0 &&
                  <small>{applications.length}</small>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-plan">
          <div className="plan-icon"><Sparkles size={17} /></div>
          <strong>Your career copilot</strong>
          <p>Find opportunities that fit your skills and goals.</p>
          <button onClick={() => changePage("My resume")}>Complete your profile <ArrowRight size={14} /></button>
        </div>
        <div className="sidebar-user">
  <div className="user-avatar">{userInitial}</div>

  <div className="sidebar-user-info">
    <strong>{userName}</strong>
    <span>{userEmail}</span>
  </div>

  <button
    title="Logout"
    onClick={handleLogout}
    className="logout-button"
  >
    <LogOut size={17} />
  </button>
</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="system-status"><i /> API workspace</div>
            <button className="icon-button notification-button" title="Notifications"
              onClick={() => notify("No new notifications.")}><Bell size={18} /></button>
            <div className="top-avatar" title={userEmail}>
  {userInitial}
</div>
          </div>
        </header>

        <div className="page-content">
          {page === "Overview" && (
            <>
              <section className="page-heading">
                <div><div className="overline">YOUR CAREER COMMAND CENTRE</div>
                  <h1>Good to see you<span>.</span></h1>
                  <p>Your job search, organised in one place. Let's find your next opportunity.</p>
                </div>
                <button className="button button-primary" onClick={() => changePage("Discover jobs")}>
                  <Search size={16} /> Find jobs
                </button>
              </section>

              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-pill"><Sparkles size={13} /> YOUR AI JOB SEARCH ASSISTANT</div>
                  <h2>Make your next<br />career move count.</h2>
                  <p>Discover relevant roles across India and international markets. Review every opportunity before applying.</p>
                  <button className="button hero-button" onClick={() => changePage("Discover jobs")}>
                    Start discovering <ArrowRight size={16} />
                  </button>
                </div>
                <div className="hero-graphic" aria-hidden="true">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="hero-star"><Sparkles size={48} /></div>
                  <div className="floating-chip chip-one"><Target size={15} /> Better matches</div>
                  <div className="floating-chip chip-two"><ShieldCheck size={15} /> You stay in control</div>
                </div>
              </section>

              <section className="metric-grid">
                <div className="metric-card"><div className="metric-icon purple"><Search /></div><span>Jobs in latest search</span><strong>{counts.discovered}</strong><small>Results from your last search</small></div>
                <div className="metric-card"><div className="metric-icon blue"><Bookmark /></div><span>Saved jobs</span><strong>{counts.saved}</strong><small>Opportunities bookmarked</small></div>
                <div className="metric-card"><div className="metric-icon green"><BriefcaseBusiness /></div><span>Tracked applications</span><strong>{counts.applications}</strong><small>Jobs in your tracker</small></div>
                <div className="metric-card"><div className="metric-icon orange"><Clock3 /></div><span>Need your review</span><strong>{counts.pending}</strong><small>Not submitted automatically</small></div>
              </section>

              <section className="section-block">
                <div className="section-title"><div><h2>Quick job search</h2><p>Search by role and target location.</p></div><button className="text-button" onClick={() => changePage("Discover jobs")}>Advanced search <ArrowRight size={14} /></button></div>
                <div className="quick-search">
                  <div className="quick-input"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="Job title, skills or keywords" /></div>
                  <div className="quick-input"><MapPin size={18} /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" /></div>
                  <button className="button button-primary" onClick={runSearch}><Search size={16} /> Search jobs</button>
                </div>
              </section>

              <section className="section-block">
                <div className="section-title"><div><h2>Your job-search setup</h2><p>Configure your sources and profile to get started.</p></div></div>
                <div className="setup-grid">
                  <button className="setup-card" onClick={() => changePage("Settings")}><div className="setup-icon"><Globe2 /></div><div><strong>Job portals</strong><span>{portals.length} sources selected</span></div><ArrowRight size={17} /></button>
                  <button className="setup-card" onClick={() => changePage("My resume")}><div className="setup-icon"><FileText /></div><div><strong>Resume profile</strong><span>{resumeName || "Add your resume"}</span></div><ArrowRight size={17} /></button>
                  <button className="setup-card" onClick={() => changePage("Applications")}><div className="setup-icon"><Activity /></div><div><strong>Application tracker</strong><span>{applications.length} tracked opportunities</span></div><ArrowRight size={17} /></button>
                </div>
              </section>
            </>
          )}

          {page === "Discover jobs" && (
            <>
              <section className="page-heading">
                <div><div className="overline">OPPORTUNITY FINDER</div><h1>Discover jobs<span>.</span></h1><p>Find roles that align with your experience and career goals.</p></div>
              </section>
              <section className="filter-panel">
                <div className="filter-heading"><div><SlidersHorizontal size={17} /><strong>Search filters</strong></div><span>Freshness: last 7 days by default</span></div>
                <div className="filter-grid">
                  <label>Job title or keywords<div className="field-wrap"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Frontend Developer" /></div></label>
                  <label>Location<div className="field-wrap"><MapPin size={16} /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or country" /></div></label>
                  <label>Search region<select value={region} onChange={(e) => setRegion(e.target.value)}><option>India</option><option>International</option><option>All regions</option></select></label>
                  <label>Posted within<select value={postedWithin} onChange={(e) => setPostedWithin(e.target.value)}><option value="1">24 hours</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
                  <label>Portal<select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}><option>All portals</option>{portals.map((portal) => <option key={portal}>{portal}</option>)}</select></label>
                  <button className="button button-primary filter-submit" onClick={runSearch} disabled={loading}>{loading ? <RefreshCw className="spin" size={16} /> : <Search size={16} />}{loading ? "Searching..." : "Search opportunities"}</button>
                </div>
              </section>
              <div className="results-heading"><div><h2>Search results</h2><p>{searched ? `${jobs.length} results returned by the connected service` : "Enter your search criteria to find opportunities."}</p></div><span className="freshness-tag"><Clock3 size={13} /> Last {postedWithin} days</span></div>
              {apiError && <div className="error-state"><CircleHelp size={19} /><span>{apiError}</span></div>}
              {loading && <div className="empty-panel"><RefreshCw className="spin" size={25} /><strong>Searching opportunities</strong><p>Contacting the job-search service...</p></div>}
              {!loading && jobs.length > 0 && <div className="job-list">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>}
              {!loading && searched && !apiError && jobs.length === 0 && <div className="empty-panel"><div className="empty-illustration"><Search size={27} /></div><strong>No jobs returned yet</strong><p>The backend is responding, but no live job sources are connected yet. We'll add supported portal integrations next.</p></div>}
              {!loading && !searched && <div className="empty-panel"><div className="empty-illustration"><Filter size={27} /></div><strong>Your next opportunity is out there</strong><p>Enter a role and location above, then run a search to see matching jobs.</p></div>}
            </>
          )}

          {page === "Saved jobs" && (
            <>
              <section className="page-heading"><div><div className="overline">YOUR SHORTLIST</div><h1>Saved jobs<span>.</span></h1><p>Keep interesting opportunities close while you decide your next move.</p></div></section>
              {savedJobs.length ? <div className="job-list">{savedJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty-panel"><div className="empty-illustration"><Bookmark size={27} /></div><strong>No saved jobs yet</strong><p>When you find a role worth revisiting, bookmark it and it will appear here.</p><button className="button button-primary" onClick={() => changePage("Discover jobs")}>Discover jobs <ArrowRight size={15} /></button></div>}
            </>
          )}

          {page === "Applications" && (
            <>
              <section className="page-heading"><div><div className="overline">APPLICATION MANAGEMENT</div><h1>Applications<span>.</span></h1><p>Track your progress. You approve every application before submission.</p></div></section>
              <div className="tracker-summary"><div><strong>{applications.length}</strong><span>Total tracked</span></div><div><strong>{applications.filter((a) => a.status === "Interested").length}</strong><span>Interested</span></div><div><strong>{applications.filter((a) => a.status === "Applied").length}</strong><span>Applied</span></div><div><strong>{applications.filter((a) => a.status === "Interview").length}</strong><span>Interview</span></div></div>
              {applications.length ? <div className="application-list">{applications.map((app) => <article className="application-row" key={app.id}><div className="company-mark">{(app.company || "J").slice(0,1)}</div><div className="application-info"><strong>{app.title}</strong><span>{app.company} · {app.location}</span></div><select value={app.status} onChange={(e) => updateApplication(app.id, e.target.value)}><option>Interested</option><option>Ready for review</option><option>Applied</option><option>Interview</option><option>Rejected</option><option>Offer</option></select><button className="icon-button danger-icon" title="Remove" onClick={() => removeApplication(app.id)}><Trash2 size={17} /></button></article>)}</div> : <div className="empty-panel"><div className="empty-illustration"><BriefcaseBusiness size={27} /></div><strong>Your tracker is ready</strong><p>Add a job to your tracker from Discover Jobs. Update its status as you progress.</p><button className="button button-primary" onClick={() => changePage("Discover jobs")}>Find a job <ArrowRight size={15} /></button></div>}
            </>
          )}

          {page === "My resume" && (
            <>
              <section className="page-heading"><div><div className="overline">YOUR PROFESSIONAL PROFILE</div><h1>My resume<span>.</span></h1><p>Prepare your resume for AI-powered job matching.</p></div></section>
              <section className="resume-panel">
                <div className="resume-icon"><FileText size={30} /></div>
                <h2>{resumeName ? "Resume selected" : "Add your latest resume"}</h2>
                <p>Upload a PDF or Word document. Resume parsing and skill extraction will be connected in the next stage.</p>
                {resumeName && <div className="selected-file"><FileText size={17} /><span>{resumeName}</span><Check size={17} /></div>}
                <label className="button button-primary upload-button"><Upload size={16} /> {resumeName ? "Choose another file" : "Upload resume"}<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleResume(e.target.files?.[0])} hidden /></label>
                {resumeName && <button className="text-button remove-resume" onClick={() => { setResumeName(""); localStorage.removeItem("jh_resume_name"); notify("Resume selection cleared."); }}><Trash2 size={14} /> Remove selected file</button>}
              </section>
              <div className="info-banner"><ShieldCheck size={19} /><div><strong>Your applications stay under your control</strong><p>Uploading a resume here does not submit applications or share your information with job portals.</p></div></div>
            </>
          )}

          {page === "Settings" && (
            <>
              <section className="page-heading"><div><div className="overline">PREFERENCES & CONNECTIONS</div><h1>Settings<span>.</span></h1><p>Choose where you want to discover opportunities.</p></div></section>
              <section className="settings-panel">
                <div className="section-title"><div><h2>Job discovery sources</h2><p>Select the portals you want included in your searches.</p></div></div>
                <div className="portal-settings">{PORTALS.map((portal) => <label className="portal-setting" key={portal}><div className="portal-logo">{portal.slice(0,1)}</div><div><strong>{portal}</strong><span>Search source preference</span></div><input type="checkbox" checked={portals.includes(portal)} onChange={(e) => setPortals((current) => e.target.checked ? [...current, portal] : current.filter((p) => p !== portal))} /></label>)}</div>
                <div className="info-banner"><CircleHelp size={19} /><div><strong>Portal connection status</strong><p>These are your selected sources, not authenticated live connections. Availability depends on each portal's supported access methods and terms.</p></div></div>
              </section>
              <section className="settings-panel approval-panel"><div className="approval-symbol"><ShieldCheck size={22} /></div><div><h2>Application approval mode</h2><p>Human approval is required before any application is submitted. Automatic submission is not enabled.</p><span className="enabled-label"><Check size={13} /> Enabled</span></div></section>
            </>
          )}
        </div>
        <footer className="app-footer"><span>TalentPilot · AI Job Hunter</span><span><i /> Your workspace is running locally</span></footer>
      </main>

      {notice && <div className="toast"><Check size={17} />{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}
    </div>
  );
}

export default App;
