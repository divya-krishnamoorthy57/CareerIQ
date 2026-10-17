import { useEffect, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../services/api";

import "./skill-gap.css";

interface Job {
  id: number;
  title: string;
  company_name?: string;
  location?: string;
  required_skills?: string;
  status?: string;
}

interface SkillGapResult {
  student?: {
    id?: number;
    name?: string;
  };

  job?: {
    id?: number;
    title?: string;
    company_name?: string;
  };

  analysis?: {
    total_required_skills?: number;
    matched_count?: number;
    missing_count?: number;
    match_percentage?: number;
    matched_skills?: string[];
    missing_skills?: string[];
  };
}

function SkillGap() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const jobIdFromUrl = searchParams.get("jobId");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(
    jobIdFromUrl || ""
  );

  const [result, setResult] =
    useState<SkillGapResult | null>(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD JOBS ================= */

  useEffect(() => {
    const loadJobs = async () => {
      const authToken =
        token ||
        localStorage.getItem("careeriq_token") ||
        "";

      if (!authToken) {
        setLoadingJobs(false);
        setError("Please login to view your skill gap.");
        return;
      }

      try {
        setLoadingJobs(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/jobs/`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Unable to load jobs."
          );
        }

        const activeJobs: Job[] = Array.isArray(data)
          ? data.filter(
              (job: Job) =>
                !job.status ||
                job.status.toLowerCase() === "active"
            )
          : [];

        setJobs(activeJobs);

        if (jobIdFromUrl) {
          const exists = activeJobs.some(
            (job) =>
              String(job.id) === String(jobIdFromUrl)
          );

          if (exists) {
            setSelectedJob(jobIdFromUrl);
          } else if (activeJobs.length > 0) {
            setSelectedJob(
              String(activeJobs[0].id)
            );
          }
        } else if (activeJobs.length > 0) {
          setSelectedJob(
            String(activeJobs[0].id)
          );
        }
      } catch (err) {
        console.error("Jobs loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load jobs."
        );
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, [token, jobIdFromUrl]);

  /* ================= LOAD SKILL GAP ================= */

  useEffect(() => {
    const loadSkillGap = async () => {
      const authToken =
        token ||
        localStorage.getItem("careeriq_token") ||
        "";

      if (!authToken || !selectedJob) {
        setResult(null);
        return;
      }

      try {
        setLoadingAnalysis(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/career/skill-gap/${selectedJob}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        console.log(
          "CareerIQ Skill Gap Response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Unable to calculate skill gap."
          );
        }

        setResult(data);
      } catch (err) {
        console.error(
          "Skill gap analysis error:",
          err
        );

        setResult(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to calculate skill gap."
        );
      } finally {
        setLoadingAnalysis(false);
      }
    };

    loadSkillGap();
  }, [token, selectedJob]);

  /* ================= JOB CHANGE ================= */

  const handleJobChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedJob(event.target.value);
  };

  /* ================= SAFE DATA ================= */

  const analysis = result?.analysis;

  const percentage = Math.max(
    0,
    Math.min(
      100,
      Number(analysis?.match_percentage || 0)
    )
  );

  const matchedSkills =
    Array.isArray(analysis?.matched_skills)
      ? analysis.matched_skills
      : [];

  const missingSkills =
    Array.isArray(analysis?.missing_skills)
      ? analysis.missing_skills
      : [];

  const totalRequired = Number(
    analysis?.total_required_skills ||
      matchedSkills.length + missingSkills.length
  );

  const matchedCount = Number(
    analysis?.matched_count ||
      matchedSkills.length
  );

  const missingCount = Number(
    analysis?.missing_count ||
      missingSkills.length
  );

  /* ================= MATCH LEVEL ================= */

  const getMatchLevel = (value: number) => {
    if (value >= 80) return "Strong Match";
    if (value >= 60) return "Good Match";
    if (value >= 40) return "Moderate Match";
    return "Low Match";
  };

  const getMatchMessage = (value: number) => {
    if (value >= 80) {
      return "Your current skills closely match this role. Focus on strengthening your existing skills and preparing for interviews.";
    }

    if (value >= 60) {
      return "You have a good foundation for this role. Focus on learning the missing skills to improve your match.";
    }

    if (value >= 40) {
      return "You have some relevant skills, but several important skills are still missing for this role.";
    }

    return "This role requires several skills that are not currently listed in your profile. Use the missing skills as your learning priorities.";
  };

  /* ================= LOADING ================= */

  if (loadingJobs) {
    return (
      <div className="skill-gap-loading">
        <div className="loading-spinner"></div>

        <p>
          Loading career opportunities...
        </p>
      </div>
    );
  }

  /* ================= PAGE ================= */

  return (
    <div className="skill-gap-page">

      {/* HEADER */}

      <section className="skill-gap-header">
        <span className="skill-gap-label">
          CAREER INTELLIGENCE
        </span>

        <h1>
          Skill Gap Analysis
        </h1>

        <p>
          Compare your current skills with the
          requirements of a target job and identify
          what you need to learn next.
        </p>
      </section>

      {/* ERROR */}

      {error && (
        <div className="skill-gap-error">
          {error}
        </div>
      )}

      {/* NO JOBS */}

      {jobs.length === 0 && !error && (
        <section className="skill-gap-empty">
          <div className="skill-gap-empty-icon">
            S
          </div>

          <h2>
            No jobs available
          </h2>

          <p>
            There are currently no active jobs
            available for skill-gap analysis.
          </p>

          <Link
            to="/student/jobs"
            className="skill-gap-back-button"
          >
            Browse Jobs
          </Link>
        </section>
      )}

      {/* JOB SELECTOR */}

      {jobs.length > 0 && (
        <section className="skill-gap-selector">

          <div>
            <label htmlFor="job-select">
              Select a target job
            </label>

            <p>
              Choose the role you want to analyse.
            </p>
          </div>

          <select
            id="job-select"
            value={selectedJob}
            onChange={handleJobChange}
          >
            {jobs.map((job) => (
              <option
                key={job.id}
                value={job.id}
              >
                {job.title}
                {job.company_name
                  ? ` — ${job.company_name}`
                  : ""}
              </option>
            ))}
          </select>

        </section>
      )}

      {/* ANALYSIS LOADING */}

      {loadingAnalysis && (
        <div className="skill-gap-analysis-loading">
          <div className="loading-spinner"></div>

          <p>
            Analysing your skills...
          </p>
        </div>
      )}

      {/* RESULT */}

      {!loadingAnalysis && result && (
        <section className="skill-gap-result">

          {/* OVERVIEW */}

          <div className="skill-gap-overview">

            <div className="skill-gap-job-info">
              <span>
                TARGET ROLE
              </span>

              <h2>
                {result.job?.title ||
                  "Selected Job"}
              </h2>

              {result.job?.company_name && (
                <p>
                  {result.job.company_name}
                </p>
              )}
            </div>

            <div className="skill-gap-score">

              <div
                className="score-circle"
                style={
                  {
                    "--skill-score":
                      `${percentage}%`,
                  } as CSSProperties
                }
              >
                <strong>
                  {percentage}%
                </strong>

                <span>
                  Match
                </span>
              </div>

              <div className="score-text">
                <h3>
                  {getMatchLevel(percentage)}
                </h3>

                <p>
                  {getMatchMessage(percentage)}
                </p>
              </div>

            </div>

          </div>

          {/* STATISTICS */}

          <div className="skill-gap-stats">

            <div className="skill-gap-stat">
              <span>
                Required Skills
              </span>

              <strong>
                {totalRequired}
              </strong>
            </div>

            <div className="skill-gap-stat matched">
              <span>
                Matched
              </span>

              <strong>
                {matchedCount}
              </strong>
            </div>

            <div className="skill-gap-stat missing">
              <span>
                Missing
              </span>

              <strong>
                {missingCount}
              </strong>
            </div>

          </div>

          {/* PROGRESS */}

          <div className="skill-gap-progress-card">

            <div className="progress-header">

              <div>
                <strong>
                  Career Readiness
                </strong>

                <span>
                  {percentage}% of required
                  skills matched
                </span>
              </div>

              <strong>
                {percentage}%
              </strong>

            </div>

            <div className="skill-gap-progress">

              <div
                className="skill-gap-progress-fill"
                style={{
                  width: `${percentage}%`,
                }}
              ></div>

            </div>

          </div>

          {/* SKILL COLUMNS */}

          <div className="skill-gap-columns">

            {/* MATCHED SKILLS */}

            <div className="skill-section matched-section">

              <div className="skill-section-header">

                <div className="skill-section-icon">
                  ✓
                </div>

                <div>
                  <h3>
                    Matched Skills
                  </h3>

                  <p>
                    Skills you already have
                  </p>
                </div>

              </div>

              {matchedSkills.length > 0 ? (
                <div className="skill-tags">

                  {matchedSkills.map(
                    (skill, index) => (
                      <span
                        className="matched-skill"
                        key={`${skill}-${index}`}
                      >
                        ✓ {skill}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <p className="no-skills">
                  No matching skills found.
                </p>
              )}

            </div>

            {/* MISSING SKILLS */}

            <div className="skill-section missing-section">

              <div className="skill-section-header">

                <div className="skill-section-icon">
                  !
                </div>

                <div>
                  <h3>
                    Missing Skills
                  </h3>

                  <p>
                    Skills you should learn
                  </p>
                </div>

              </div>

              {missingSkills.length > 0 ? (
                <div className="skill-tags">

                  {missingSkills.map(
                    (skill, index) => (
                      <span
                        className="missing-skill"
                        key={`${skill}-${index}`}
                      >
                        + {skill}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <p className="no-skills">
                  Great! No missing skills
                  detected.
                </p>
              )}

            </div>

          </div>

          {/* AI RECOMMENDATION */}

          <div className="skill-gap-recommendation">

            <div className="recommendation-icon">
              AI
            </div>

            <div>

              <span>
                CAREERIQ RECOMMENDATION
              </span>

              <h3>
                Your next learning priority
              </h3>

              {missingSkills.length > 0 ? (
                <p>
                  Focus first on{" "}
                  <strong>
                    {missingSkills
                      .slice(0, 2)
                      .join(" and ")}
                  </strong>
                  . Improving these skills
                  will increase your readiness
                  for this role.
                </p>
              ) : (
                <p>
                  Your listed skills cover the
                  requirements of this role.
                  Focus on interview preparation
                  and strengthening your projects.
                </p>
              )}

            </div>

          </div>

        </section>
      )}

    </div>
  );
}

export default SkillGap;