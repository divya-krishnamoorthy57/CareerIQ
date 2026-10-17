import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../services/api";

import "./learning-roadmap.css";

interface Job {
  id: number;
  title: string;
  company_name?: string;
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

interface RoadmapItem {
  skill: string;
  step: number;
  description: string;
  action: string;
}

function LearningRoadmap() {
  const { token } = useAuth();

  const authToken =
    token ||
    localStorage.getItem("careeriq_token") ||
    "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState("");

  const [skillGap, setSkillGap] =
    useState<SkillGapResult | null>(null);

  const [loadingJobs, setLoadingJobs] =
    useState(true);

  const [loadingRoadmap, setLoadingRoadmap] =
    useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD JOBS
     ===================================================== */

  useEffect(() => {
    const loadJobs = async () => {
      if (!authToken) {
        setLoadingJobs(false);
        setError("Please login to view your learning roadmap.");
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

        console.log(
          "CareerIQ Jobs:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Unable to load jobs."
          );
        }

        const activeJobs: Job[] =
          Array.isArray(data)
            ? data.filter(
                (job: Job) =>
                  !job.status ||
                  job.status.toLowerCase() ===
                    "active"
              )
            : [];

        setJobs(activeJobs);

        if (activeJobs.length > 0) {
          setSelectedJob(
            String(activeJobs[0].id)
          );
        }
      } catch (err) {
        console.error(
          "Jobs loading error:",
          err
        );

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
  }, [authToken]);

  /* =====================================================
     LOAD SKILL GAP
     ===================================================== */

  useEffect(() => {
    const loadSkillGap = async () => {
      if (!authToken || !selectedJob) {
        setSkillGap(null);
        return;
      }

      try {
        setLoadingRoadmap(true);
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
          "CareerIQ Skill Gap:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Unable to calculate skill gap."
          );
        }

        setSkillGap(data);
      } catch (err) {
        console.error(
          "Roadmap loading error:",
          err
        );

        setSkillGap(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to create learning roadmap."
        );
      } finally {
        setLoadingRoadmap(false);
      }
    };

    loadSkillGap();
  }, [authToken, selectedJob]);

  /* =====================================================
     SKILL DESCRIPTIONS
     ===================================================== */

  const getSkillDescription = (
    skill: string
  ) => {
    const normalized =
      skill.toLowerCase();

    if (normalized.includes("python")) {
      return "Learn Python fundamentals, functions, collections, file handling and practical programming.";
    }

    if (normalized.includes("sql")) {
      return "Learn queries, joins, filtering, aggregation, subqueries and database operations.";
    }

    if (normalized.includes("react")) {
      return "Learn components, props, state, hooks, API integration and React application structure.";
    }

    if (normalized.includes("javascript")) {
      return "Strengthen JavaScript fundamentals, ES6 syntax, arrays, objects, functions and asynchronous programming.";
    }

    if (normalized.includes("typescript")) {
      return "Learn types, interfaces, generics and how TypeScript is used in modern React applications.";
    }

    if (normalized.includes("git")) {
      return "Learn Git fundamentals, branches, commits, merging and GitHub workflows.";
    }

    if (normalized.includes("html")) {
      return "Learn semantic HTML, forms, accessibility and page structure.";
    }

    if (normalized.includes("css")) {
      return "Learn layouts, Flexbox, Grid, responsive design and modern CSS.";
    }

    if (normalized.includes("java")) {
      return "Learn Java syntax, object-oriented programming, collections and exception handling.";
    }

    return `Build practical knowledge in ${skill} and apply it through a small project.`;
  };

  /* =====================================================
     PRACTICAL ACTION
     ===================================================== */

  const getSkillAction = (
    skill: string
  ) => {
    const normalized =
      skill.toLowerCase();

    if (normalized.includes("git")) {
      return "Create a GitHub repository and practice the basic Git workflow.";
    }

    if (
      normalized.includes("react") ||
      normalized.includes("python") ||
      normalized.includes("java")
    ) {
      return `Build a small ${skill} project and add it to your portfolio.`;
    }

    if (normalized.includes("sql")) {
      return "Practice SQL queries using a sample database.";
    }

    return `Complete a practical ${skill} exercise and document what you learned.`;
  };

  /* =====================================================
     ANALYSIS DATA
     ===================================================== */

  const analysis = skillGap?.analysis;

  const matchedSkills =
    Array.isArray(
      analysis?.matched_skills
    )
      ? analysis.matched_skills
      : [];

  const missingSkills =
    Array.isArray(
      analysis?.missing_skills
    )
      ? analysis.missing_skills
      : [];

  const matchPercentage = Math.max(
    0,
    Math.min(
      100,
      Number(
        analysis?.match_percentage || 0
      )
    )
  );

  const totalRequired =
    Number(
      analysis?.total_required_skills ||
        matchedSkills.length +
          missingSkills.length
    );

  const matchedCount =
    Number(
      analysis?.matched_count ||
        matchedSkills.length
    );

  const missingCount =
    Number(
      analysis?.missing_count ||
        missingSkills.length
    );

  /* =====================================================
     CREATE ROADMAP
     ===================================================== */

  const roadmap =
    useMemo<RoadmapItem[]>(() => {
      return missingSkills.map(
        (skill, index) => ({
          skill,
          step: index + 1,
          description:
            getSkillDescription(skill),
          action:
            getSkillAction(skill),
        })
      );
    }, [missingSkills]);

  /* =====================================================
     LOADING
     ===================================================== */

  if (loadingJobs) {
    return (
      <div className="roadmap-loading">
        <div className="loading-spinner"></div>

        <p>
          Preparing your learning roadmap...
        </p>
      </div>
    );
  }

  /* =====================================================
     UI
     ===================================================== */

  return (
    <div className="learning-roadmap-page">

      {/* HEADER */}

      <section className="roadmap-header">
        <span className="roadmap-label">
          PERSONALIZED LEARNING
        </span>

        <h1>
          Your Learning Roadmap
        </h1>

        <p>
          Turn your skill gaps into a
          structured learning plan for
          your target career.
        </p>
      </section>

      {/* JOB SELECTOR */}

      {jobs.length > 0 && (
        <section className="roadmap-selector">
          <div>
            <label htmlFor="roadmap-job">
              Choose your target role
            </label>

            <p>
              Select a job to generate your
              personalized learning plan.
            </p>
          </div>

          <select
            id="roadmap-job"
            value={selectedJob}
            onChange={(event) =>
              setSelectedJob(
                event.target.value
              )
            }
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

      {/* ERROR */}

      {error && (
        <div className="roadmap-error">
          {error}
        </div>
      )}

      {/* NO JOBS */}

      {jobs.length === 0 &&
        !error && (
          <section className="roadmap-empty">

            <div className="roadmap-empty-icon">
              L
            </div>

            <h2>
              No learning roadmap available
            </h2>

            <p>
              Choose a job opportunity first
              so CareerIQ can identify the
              skills you need to develop.
            </p>

            <Link to="/student/jobs">
              Explore Jobs
            </Link>

          </section>
        )}

      {/* LOADING */}

      {loadingRoadmap && (
        <div className="roadmap-loading-inline">
          <div className="loading-spinner"></div>

          <p>
            Analysing your skill gaps...
          </p>
        </div>
      )}

      {/* ROADMAP */}

      {!loadingRoadmap &&
        skillGap &&
        analysis && (
          <>

            {/* OVERVIEW */}

            <section className="roadmap-overview">

              <div className="roadmap-role">

                <span>
                  TARGET ROLE
                </span>

                <h2>
                  {skillGap.job?.title ||
                    "Selected Job"}
                </h2>

                {skillGap.job
                  ?.company_name && (
                  <p>
                    {
                      skillGap.job
                        .company_name
                    }
                  </p>
                )}

              </div>

              <div className="roadmap-match">

                <strong>
                  {Math.round(
                    matchPercentage
                  )}
                  %
                </strong>

                <span>
                  Current Match
                </span>

              </div>

            </section>

            {/* STATS */}

            <section className="roadmap-stats">

              <div className="roadmap-stat">

                <span>
                  Required Skills
                </span>

                <strong>
                  {totalRequired}
                </strong>

              </div>

              <div className="roadmap-stat matched">

                <span>
                  Already Matched
                </span>

                <strong>
                  {matchedCount}
                </strong>

              </div>

              <div className="roadmap-stat missing">

                <span>
                  Skills to Learn
                </span>

                <strong>
                  {missingCount}
                </strong>

              </div>

            </section>

            {/* PROGRESS */}

            <section className="roadmap-progress-card">

              <div className="roadmap-progress-header">

                <div>
                  <strong>
                    Career Readiness
                  </strong>

                  <span>
                    {matchedCount} of{" "}
                    {totalRequired} required
                    skills matched
                  </span>
                </div>

                <strong>
                  {Math.round(
                    matchPercentage
                  )}
                  %
                </strong>

              </div>

              <div className="roadmap-progress">

                <div
                  className="roadmap-progress-fill"
                  style={{
                    width: `${matchPercentage}%`,
                  }}
                />

              </div>

            </section>

            {/* COMPLETE */}

            {roadmap.length === 0 && (
              <section className="roadmap-complete">

                <div className="complete-icon">
                  ✓
                </div>

                <h2>
                  You're ready for this role
                </h2>

                <p>
                  No missing skills were
                  identified. Focus on
                  interview preparation,
                  projects and strengthening
                  your existing skills.
                </p>

                <Link to="/student/interview">
                  Practice Interview
                </Link>

              </section>
            )}

            {/* LEARNING PLAN */}

            {roadmap.length > 0 && (
              <section className="roadmap-section">

                <div className="roadmap-section-heading">

                  <span>
                    LEARNING PLAN
                  </span>

                  <h2>
                    Skills you should develop
                  </h2>

                  <p>
                    Follow these steps to
                    gradually close your
                    skill gap.
                  </p>

                </div>

                <div className="roadmap-list">

                  {roadmap.map((item) => (
                    <div
                      className="roadmap-item"
                      key={`${item.skill}-${item.step}`}
                    >

                      <div className="roadmap-number">
                        {item.step}
                      </div>

                      <div className="roadmap-line"></div>

                      <div className="roadmap-content">

                        <div className="roadmap-skill">
                          {item.skill}
                        </div>

                        <p>
                          {item.description}
                        </p>

                        <div className="roadmap-action">

                          <strong>
                            Practical action
                          </strong>

                          <span>
                            {item.action}
                          </span>

                        </div>

                      </div>

                    </div>
                  ))}

                </div>

              </section>
            )}

            {/* MATCHED SKILLS */}

            {matchedSkills.length > 0 && (
              <section className="roadmap-matched">

                <span>
                  ALREADY DEVELOPED
                </span>

                <h2>
                  Skills you already have
                </h2>

                <div className="matched-skill-list">

                  {matchedSkills.map(
                    (skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                      >
                        ✓ {skill}
                      </span>
                    )
                  )}

                </div>

              </section>
            )}

            {/* CTA */}

            <section className="roadmap-cta">

              <div>

                <span>
                  KEEP BUILDING
                </span>

                <h2>
                  Turn your roadmap into
                  real projects.
                </h2>

                <p>
                  Learning becomes more
                  valuable when you apply it.
                  Build projects, update your
                  resume and track your
                  progress.
                </p>

              </div>

              <div className="roadmap-cta-actions">

                <Link to="/student/resume">
                  Improve Resume
                </Link>

                <Link to="/student/interview">
                  Practice Interview
                </Link>

              </div>

            </section>

          </>
        )}

    </div>
  );
}

export default LearningRoadmap;