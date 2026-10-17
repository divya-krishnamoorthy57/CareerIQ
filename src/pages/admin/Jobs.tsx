import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../services/api";
import type { Job } from "../../types/job";
import "./jobs.css";

interface JobMatch {
  percentage: number;
  level: string;
  matched_skills: string[];
  missing_skills: string[];
}

interface Application {
  id: number;
  job_id: number;
  job_title?: string;
  status: string;
  applied_at: string;
}

function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Record<number, JobMatch>>({});

  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [applyingJobId, setApplyingJobId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // LOAD JOBS
  // --------------------------------------------------

  useEffect(() => {
  console.log("🔥 JOBS COMPONENT LOADED");
  loadJobs();
}, []);

  useEffect(() => {
    if (jobs.length > 0) {
      loadJobMatches(jobs);
    }
  }, [jobs]);

  async function loadJobs() {
  console.log("🔥 loadJobs() CALLED");

  try {

      const token = localStorage.getItem("careeriq_token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [jobsResponse, applicationsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/jobs/`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_BASE_URL}/applications/my`, {
            method: "GET",
            headers,
          }),
        ]);

      // -----------------------------
      // JOB AUTHENTICATION
      // -----------------------------

      if (jobsResponse.status === 401) {
        setError(
          "Your login session has expired. Please login again."
        );
        return;
      }

      if (!jobsResponse.ok) {
        const errorText = await jobsResponse.text();

        console.error(
          "Jobs API error:",
          jobsResponse.status,
          errorText
        );

        throw new Error(
          `Unable to load jobs (${jobsResponse.status})`
        );
      }

      const jobsData = await jobsResponse.json();

      console.log("CareerIQ jobs response:", jobsData);

      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
      } else {
        console.error(
          "Unexpected jobs response:",
          jobsData
        );

        setJobs([]);
      }

      // -----------------------------
      // APPLICATIONS
      // -----------------------------

      if (applicationsResponse.ok) {
        const applicationsData =
          await applicationsResponse.json();

        console.log(
          "CareerIQ applications:",
          applicationsData
        );

        if (Array.isArray(applicationsData)) {
          setApplications(applicationsData);
        } else {
          setApplications([]);
        }
      } else {
        console.warn(
          "Applications could not be loaded:",
          applicationsResponse.status
        );

        setApplications([]);
      }
    } catch (err) {
      console.error(
        "Jobs loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // JOB MATCHING
  // --------------------------------------------------

  async function loadJobMatches(jobList: Job[]) {
    const token =
      localStorage.getItem("careeriq_token");

    if (!token) {
      return;
    }

    const results: Record<number, JobMatch> = {};

    await Promise.all(
      jobList.map(async (job) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/career/job-match/${job.id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            return;
          }

          const data = await response.json();

          if (data?.match) {
            results[job.id] = {
              percentage: Number(
                data.match.percentage ?? 0
              ),

              level:
                data.match.level ||
                "Match",

              matched_skills:
                Array.isArray(
                  data.match.matched_skills
                )
                  ? data.match.matched_skills
                  : [],

              missing_skills:
                Array.isArray(
                  data.match.missing_skills
                )
                  ? data.match.missing_skills
                  : [],
            };
          }
        } catch (err) {
          console.error(
            `Match loading failed for job ${job.id}`,
            err
          );
        }
      })
    );

    setMatches(results);
  }

  // --------------------------------------------------
  // APPLICATION CHECK
  // --------------------------------------------------

  function hasApplied(jobId: number) {
    return applications.some(
      (application) =>
        Number(application.job_id) ===
        Number(jobId)
    );
  }

  // --------------------------------------------------
  // MARK AS APPLIED
  // --------------------------------------------------

  async function markAsApplied(job: Job) {
    try {
      setApplyingJobId(job.id);
      setMessage("");

      const token =
        localStorage.getItem("careeriq_token");

      if (!token) {
        setMessage("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/applications/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            job_id: job.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to mark application."
        );
      }

      setMessage(
        `"${job.title}" has been added to your applications.`
      );

      await loadJobs();
    } catch (err) {
      console.error(
        "Application error:",
        err
      );

      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to mark application."
      );
    } finally {
      setApplyingJobId(null);
    }
  }

  // --------------------------------------------------
  // OPEN APPLICATION
  // --------------------------------------------------

  function openApplicationPage(job: Job) {
    const applicationUrl =
      job.application_url ||
      job.source_url;

    if (!applicationUrl) {
      setMessage(
        "Application link is not available for this job."
      );
      return;
    }

    window.open(
      applicationUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // --------------------------------------------------
  // FRESHNESS
  // --------------------------------------------------

  function getFreshness(job: Job) {
    if (!job.last_checked_at) {
      return "Recently listed";
    }

    const checked = new Date(
      job.last_checked_at
    );

    const now = new Date();

    const difference =
      now.getTime() - checked.getTime();

    if (difference < 0) {
      return "Recently verified";
    }

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Verified just now";
    }

    if (minutes < 60) {
      return `Verified ${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `Verified ${hours} hr ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `Verified ${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  // --------------------------------------------------
  // ACTIVE JOBS
  // --------------------------------------------------

  const activeJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        !job.status ||
        job.status.toLowerCase() ===
          "active"
    );
  }, [jobs]);

  // --------------------------------------------------
  // FILTERED JOBS
  // --------------------------------------------------

  const filteredJobs = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return activeJobs.filter((job) => {
      const title =
        job.title?.toLowerCase() || "";

      const company =
        job.company_name?.toLowerCase() || "";

      const location =
        job.location?.toLowerCase() || "";

      const skills =
        job.required_skills?.toLowerCase() ||
        "";

      const description =
        job.description?.toLowerCase() ||
        "";

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        company.includes(searchValue) ||
        location.includes(searchValue) ||
        skills.includes(searchValue) ||
        description.includes(searchValue);

      const matchesType =
        jobType === "All" ||
        job.job_type === jobType;

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    activeJobs,
    search,
    jobType,
  ]);

  // --------------------------------------------------
  // JOB TYPES
  // --------------------------------------------------

  const jobTypes = useMemo(() => {
    const types = activeJobs
      .map((job) => job.job_type)
      .filter(
        (type): type is string =>
          Boolean(type)
      );

    return [
      "All",
      ...Array.from(new Set(types)),
    ];
  }, [activeJobs]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="jobs-page">

      {/* HERO */}

      <section className="jobs-hero">

        <div>
          <span className="jobs-eyebrow">
            CAREER OPPORTUNITIES
          </span>

          <h1>
            Find your next opportunity
          </h1>

          <p>
            Explore current job opportunities
            matched to your career goals and
            skills.
          </p>
        </div>

        <div className="jobs-hero-stat">

          <strong>
            {activeJobs.length}
          </strong>

          <span>
            Active Jobs
          </span>

        </div>

      </section>

      {/* ERROR */}

      {error && (
        <div className="jobs-error">

          <div className="jobs-error-icon">
            !
          </div>

          <div>

            <strong>
              Unable to load jobs
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={loadJobs}
            >
              Try Again
            </button>

          </div>

        </div>
      )}

      {/* TOOLBAR */}

      {!error && !loading && (
        <section className="jobs-toolbar">

          <div className="jobs-search">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <div className="jobs-filter">

            {jobTypes.map((type) => (

              <button
                key={type}
                type="button"
                className={
                  jobType === type
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setJobType(type)
                }
              >
                {type}
              </button>

            ))}

          </div>

        </section>
      )}

      {/* LOADING */}

      {loading ? (

        <div className="jobs-loading">

          <div className="loading-spinner" />

          <p>
            Loading current opportunities...
          </p>

        </div>

      ) : !error ? (

        <>

          {/* RESULTS HEADER */}

          <div className="jobs-results-header">

            <div>
              Showing{" "}
              <strong>
                {filteredJobs.length}
              </strong>{" "}
              opportunities
            </div>

            <span>
              {jobs.length} jobs available in CareerIQ
            </span>

          </div>

          {/* EMPTY */}

          {filteredJobs.length === 0 ? (

            <div className="jobs-empty">

              <div className="empty-icon">
                J
              </div>

              <h2>
                No matching jobs found
              </h2>

              <p>
                Try changing your search or
                filter to find more
                opportunities.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setJobType("All");
                }}
              >
                View All Jobs
              </button>

            </div>

          ) : (

            <div className="jobs-grid">

              {filteredJobs.map((job) => {

                const match =
                  matches[job.id];

                const applied =
                  hasApplied(job.id);

                const applicationUrl =
                  job.application_url ||
                  job.source_url;

                return (

                  <article
                    className="job-card"
                    key={job.id}
                  >

                    {/* COMPANY */}

                    <div className="job-card-top">

                      <div className="company-avatar">

                        {(
                          job.company_name ||
                          "C"
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                      <div className="job-company">

                        <span>
                          {job.company_name ||
                            "Company"}
                        </span>

                        <small>
                          {job.location ||
                            "Location not specified"}
                        </small>

                      </div>

                      <span className="live-badge">
                        LIVE
                      </span>

                    </div>

                    {/* TITLE */}

                    <h2 className="job-title">
                      {job.title}
                    </h2>

                    {/* META */}

                    <div className="job-meta">

                      {job.job_type && (
                        <span>
                          {job.job_type}
                        </span>
                      )}

                      {job.salary && (
                        <span>
                          {job.salary}
                        </span>
                      )}

                    </div>

                    {/* MATCH */}

                    {match && (

                      <div className="match-box">

                        <div className="match-header">

                          <span>
                            CareerIQ Match
                          </span>

                          <strong>
                            {match.percentage}%
                          </strong>

                        </div>

                        <div className="match-bar">

                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  match.percentage
                                )
                              )}%`,
                            }}
                          />

                        </div>

                        <small>
                          {match.level}
                        </small>

                      </div>

                    )}

                    {/* DESCRIPTION */}

                    {job.description && (

                      <p className="job-description">
                        {job.description}
                      </p>

                    )}

                    {/* SKILLS */}

                    {job.required_skills && (

                      <div className="job-skills">

                        <span className="skills-label">
                          Required skills
                        </span>

                        <div className="skills-list">

                          {job.required_skills
                            .split(",")
                            .map(
                              (
                                skill,
                                index
                              ) => (

                                <span
                                  key={`${skill}-${index}`}
                                  className="skill-tag"
                                >
                                  {skill.trim()}
                                </span>

                              )
                            )}

                        </div>

                      </div>

                    )}

                    {/* FRESHNESS */}

                    <div className="job-freshness">

                      <span>
                        ●
                      </span>

                      {getFreshness(job)}

                      {job.source_name && (
                        <>

                          <span className="freshness-dot">
                            •
                          </span>

                          Source:{" "}
                          {job.source_name}

                        </>
                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="job-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          window.location.href =
                            `/student/skill-gap?jobId=${job.id}`
                        }
                      >
                        Skill Gap
                      </button>

                      {job.source_url && (

                        <a
                          href={
                            job.source_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-button"
                        >
                          Source
                        </a>

                      )}

                      {applicationUrl ? (

                        <button
                          type="button"
                          className="apply-button"
                          onClick={() =>
                            openApplicationPage(
                              job
                            )
                          }
                        >
                          Apply Directly ↗
                        </button>

                      ) : (

                        <button
                          type="button"
                          className="apply-button disabled"
                          disabled
                        >
                          Application Link
                          Unavailable
                        </button>

                      )}

                    </div>

                    {/* MARK APPLIED */}

                    {applicationUrl &&
                      !applied && (

                        <div className="application-confirm">

                          <span>
                            Applied already?
                          </span>

                          <button
                            type="button"
                            disabled={
                              applyingJobId ===
                              job.id
                            }
                            onClick={() =>
                              markAsApplied(
                                job
                              )
                            }
                          >
                            {applyingJobId ===
                            job.id
                              ? "Saving..."
                              : "Mark as Applied"}

                          </button>

                        </div>

                      )}

                    {/* APPLIED */}

                    {applied && (

                      <div className="already-applied">
                        ✓ Application recorded
                      </div>

                    )}

                  </article>

                );
              })}

            </div>

          )}

        </>

      ) : null}

      {/* TOAST */}

      {message && (

        <div className="jobs-toast">
          {message}
        </div>

      )}

    </div>
  );
}

export default Jobs;