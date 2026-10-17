import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import "./career-analysis.css";
import { API_BASE_URL } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface Profile {
  name?: string;
  phone?: string;
  location?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduation_year?: number | string;
  cgpa?: string;
  skills?: string;
  career_goal?: string;
  preferred_job_role?: string;
}

interface Job {
  id: number;
  title: string;
  location?: string;
  description?: string;
  required_skills?: string;
  salary?: string;
  job_type?: string;
  company_id?: number;
  status?: string;
}

interface CareerMatch {
  job: Job;
  percentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function normalizeSkill(skill: string): string {
  const value = skill.trim().toLowerCase();

  const aliases: Record<string, string> = {
    "react.js": "react",
    reactjs: "react",
    "node.js": "node",
    nodejs: "node",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    "next.js": "next",
    nextjs: "next",
    "express.js": "express",
    expressjs: "express",
    "mysql database": "mysql",
    "postgresql database": "postgresql",
  };

  return aliases[value] || value;
}

function parseSkills(value?: string): string[] {
  if (!value) return [];

  return value
    .split(/[,;\n|]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function getMatchLevel(percentage: number): string {
  if (percentage >= 80) return "Excellent Match";
  if (percentage >= 60) return "Good Match";
  if (percentage >= 40) return "Moderate Match";
  return "Needs Improvement";
}

export default function CareerAnalysis() {
  const { token } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCareerData();
  }, [token]);

  const loadCareerData = async () => {
    setLoading(true);
    setError("");

    try {
      const savedToken =
        token || localStorage.getItem("careeriq_token") || "";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (savedToken) {
        headers.Authorization = `Bearer ${savedToken}`;
      }

      const [profileResponse, jobsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/profile/`, {
          method: "GET",
          headers,
        }),
        fetch(`${API_BASE_URL}/jobs/`, {
          method: "GET",
          headers,
        }),
      ]);

      if (!profileResponse.ok) {
        throw new Error("Unable to load your profile.");
      }

      if (!jobsResponse.ok) {
        throw new Error("Unable to load available jobs.");
      }

      const profileData = await profileResponse.json();
      const jobsData = await jobsResponse.json();

      let localProfile: Profile = {};

      const localProfileRaw =
        localStorage.getItem("careeriq_profile");

      if (localProfileRaw) {
        try {
          localProfile = JSON.parse(localProfileRaw);
        } catch {
          localProfile = {};
        }
      }

      const mergedProfile: Profile = {
        name: profileData?.name || localProfile?.name || "",
        phone: profileData?.phone || localProfile?.phone || "",
        location:
          profileData?.location ||
          localProfile?.location ||
          "",
        college:
          profileData?.college ||
          localProfile?.college ||
          "",
        degree:
          profileData?.degree ||
          localProfile?.degree ||
          "",
        department:
          profileData?.department ||
          localProfile?.department ||
          "",
        graduation_year:
          profileData?.graduation_year ||
          localProfile?.graduation_year ||
          "",
        cgpa:
          profileData?.cgpa ||
          localProfile?.cgpa ||
          "",
        skills:
          profileData?.skills ||
          localProfile?.skills ||
          "",
        career_goal:
          profileData?.career_goal ||
          localProfile?.career_goal ||
          "",
        preferred_job_role:
          profileData?.preferred_job_role ||
          localProfile?.preferred_job_role ||
          "",
      };

      setProfile(mergedProfile);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error("Career Analysis Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load career analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  const studentSkills = useMemo(() => {
    return parseSkills(profile?.skills);
  }, [profile?.skills]);

  const careerMatches = useMemo<CareerMatch[]>(() => {
    const studentSkillSet = new Set(
      studentSkills.map(normalizeSkill)
    );

    return jobs
      .filter((job) => job.status !== "inactive")
      .map((job) => {
        const requiredSkills = parseSkills(
          job.required_skills
        );

        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];

        requiredSkills.forEach((skill) => {
          if (
            studentSkillSet.has(
              normalizeSkill(skill)
            )
          ) {
            matchedSkills.push(skill);
          } else {
            missingSkills.push(skill);
          }
        });

        const percentage =
          requiredSkills.length > 0
            ? Math.round(
                (matchedSkills.length /
                  requiredSkills.length) *
                  100
              )
            : 0;

        return {
          job,
          percentage,
          matchedSkills,
          missingSkills,
        };
      })
      .sort(
        (a, b) => b.percentage - a.percentage
      );
  }, [jobs, studentSkills]);

  const bestMatch = careerMatches[0];

  const averageMatch =
    careerMatches.length > 0
      ? Math.round(
          careerMatches.reduce(
            (sum, item) =>
              sum + item.percentage,
            0
          ) / careerMatches.length
        )
      : 0;

  const displayName =
    profile?.name ||
    (() => {
      try {
        const storedUser =
          localStorage.getItem(
            "careeriq_user"
          );

        if (storedUser) {
          const user = JSON.parse(storedUser);
          return user?.name || "Student";
        }
      } catch {
        return "Student";
      }

      return "Student";
    })();

  const careerGoal =
    profile?.career_goal ||
    profile?.preferred_job_role ||
    "Career goal not set yet";

  if (loading) {
    return (
      <div className="career-analysis-page">
        <div className="career-loading-card">
          <div className="career-spinner"></div>
          <h3>Analyzing your career profile</h3>
          <p>
            CareerIQ is preparing your personalized
            career insights...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="career-analysis-page">

      {/* TOP HEADER */}

      <div className="career-top-header">
        <div>
          <div className="career-page-label">
            CAREER INTELLIGENCE
          </div>

          <h1>Career Analysis</h1>

          <p>
            Discover how your current skills match
            real career opportunities.
          </p>
        </div>

        <div className="career-header-badge">
          <span className="career-header-dot"></span>
          AI Analysis Active
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="career-error-card">
          <div className="career-error-icon">!</div>

          <div>
            <strong>
              Unable to load career data
            </strong>
            <p>{error}</p>
          </div>

          <button
            onClick={loadCareerData}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {/* PROFILE + SCORE */}

      <section className="career-overview-grid">

        <div className="career-profile-panel">

          <div className="career-profile-heading">
            <div className="career-avatar">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <span>YOUR PROFILE</span>
              <h2>{displayName}</h2>
              <p>{careerGoal}</p>
            </div>
          </div>

          <div className="career-info-grid">

            <div className="career-info-item">
              <span>College</span>
              <strong>
                {profile?.college || "Not added"}
              </strong>
            </div>

            <div className="career-info-item">
              <span>Degree</span>
              <strong>
                {profile?.degree || "Not added"}
              </strong>
            </div>

            <div className="career-info-item">
              <span>Department</span>
              <strong>
                {profile?.department || "Not added"}
              </strong>
            </div>

            <div className="career-info-item">
              <span>Graduation</span>
              <strong>
                {profile?.graduation_year ||
                  "Not added"}
              </strong>
            </div>

            <div className="career-info-item">
              <span>CGPA</span>
              <strong>
                {profile?.cgpa || "Not added"}
              </strong>
            </div>

            <div className="career-info-item">
              <span>Skills</span>
              <strong>
                {studentSkills.length}
              </strong>
            </div>

          </div>
        </div>

        {/* READINESS SCORE */}

        <div className="career-score-panel">

          <div className="career-score-label">
            CAREER READINESS
          </div>

          <div className="career-score-ring">
            <div className="career-score-inner">
              <strong>
                {bestMatch
                  ? bestMatch.percentage
                  : 0}
                %
              </strong>
              <span>Best Match</span>
            </div>
          </div>

          <h3>
            {bestMatch
              ? getMatchLevel(
                  bestMatch.percentage
                )
              : "No Match Yet"}
          </h3>

          <p>
            Based on your current skills and
            available opportunities.
          </p>

        </div>

      </section>

      {/* QUICK STATS */}

      <section className="career-stat-grid">

        <div className="career-stat-card">
          <div className="career-stat-icon purple">
            ◈
          </div>

          <div>
            <span>Available Jobs</span>
            <strong>{careerMatches.length}</strong>
          </div>
        </div>

        <div className="career-stat-card">
          <div className="career-stat-icon blue">
            ✓
          </div>

          <div>
            <span>Your Skills</span>
            <strong>{studentSkills.length}</strong>
          </div>
        </div>

        <div className="career-stat-card">
          <div className="career-stat-icon green">
            ↗
          </div>

          <div>
            <span>Average Match</span>
            <strong>{averageMatch}%</strong>
          </div>
        </div>

        <div className="career-stat-card">
          <div className="career-stat-icon orange">
            ★
          </div>

          <div>
            <span>Best Opportunity</span>
            <strong>
              {bestMatch
                ? `${bestMatch.percentage}%`
                : "—"}
            </strong>
          </div>
        </div>

      </section>

      {/* BEST MATCH */}

      {bestMatch && (
        <section className="best-career-section">

          <div className="section-title-row">
            <div>
              <span>RECOMMENDED FOR YOU</span>
              <h2>Best career opportunity</h2>
            </div>

            <div className="best-match-tag">
              BEST MATCH
            </div>
          </div>

          <div className="best-career-card">

            <div className="best-career-main">

              <div className="company-placeholder">
                {bestMatch.job.title
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2>{bestMatch.job.title}</h2>

                <div className="job-meta-row">

                  {bestMatch.job.location && (
                    <span>
                      📍 {bestMatch.job.location}
                    </span>
                  )}

                  {bestMatch.job.job_type && (
                    <span>
                      {bestMatch.job.job_type}
                    </span>
                  )}

                  {bestMatch.job.salary && (
                    <span>
                      {bestMatch.job.salary}
                    </span>
                  )}

                </div>
              </div>

            </div>

            <div className="best-score">
              <strong>
                {bestMatch.percentage}%
              </strong>
              <span>Match</span>
            </div>

          </div>

          <div className="best-description">
            {bestMatch.job.description ||
              "This opportunity matches your current career profile."}
          </div>

          <div className="skills-analysis-grid">

            <div className="skills-column matched-column">

              <div className="skills-column-header">
                <div className="skills-check">✓</div>

                <div>
                  <h3>Skills you have</h3>
                  <span>
                    {bestMatch.matchedSkills.length} matched
                  </span>
                </div>
              </div>

              <div className="skill-pills">
                {bestMatch.matchedSkills.length > 0 ? (
                  bestMatch.matchedSkills.map(
                    (skill) => (
                      <span
                        className="skill-pill matched"
                        key={skill}
                      >
                        ✓ {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="no-skills">
                    No matching skills yet
                  </span>
                )}
              </div>

            </div>

            <div className="skills-column missing-column">

              <div className="skills-column-header">
                <div className="skills-warning">!</div>

                <div>
                  <h3>Skills to improve</h3>
                  <span>
                    {bestMatch.missingSkills.length} missing
                  </span>
                </div>
              </div>

              <div className="skill-pills">
                {bestMatch.missingSkills.length > 0 ? (
                  bestMatch.missingSkills.map(
                    (skill) => (
                      <span
                        className="skill-pill missing"
                        key={skill}
                      >
                        + {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="no-skills">
                    You meet all required skills
                  </span>
                )}
              </div>

            </div>

          </div>

        </section>
      )}

      {/* ALL JOB MATCHES */}

      <section className="all-jobs-section">

        <div className="section-title-row">

          <div>
            <span>CAREER OPPORTUNITIES</span>
            <h2>All job matches</h2>
          </div>

          <span className="job-count">
            {careerMatches.length} opportunities
          </span>

        </div>

        <div className="job-match-list">

          {careerMatches.map(
            (match, index) => {

              const progressStyle = {
                "--job-progress":
                  `${match.percentage}%`,
              } as CSSProperties;

              return (
                <article
                  className="job-match-card"
                  key={match.job.id}
                >

                  <div className="job-match-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="job-match-details">

                    <div className="job-match-title-row">
                      <div>
                        <h3>
                          {match.job.title}
                        </h3>

                        <div className="job-small-meta">

                          {match.job.location && (
                            <span>
                              📍{" "}
                              {match.job.location}
                            </span>
                          )}

                          {match.job.job_type && (
                            <span>
                              {match.job.job_type}
                            </span>
                          )}

                        </div>
                      </div>

                      <div className="job-percentage">
                        {match.percentage}%
                      </div>
                    </div>

                    <div className="job-progress-track">
                      <div
                        className="job-progress-fill"
                        style={progressStyle}
                      ></div>
                    </div>

                    <div className="job-match-bottom">

                      <span>
                        {match.matchedSkills.length}{" "}
                        skills matched
                      </span>

                      <span>
                        {match.missingSkills.length}{" "}
                        skills to improve
                      </span>

                      <strong>
                        {getMatchLevel(
                          match.percentage
                        )}
                      </strong>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

        {careerMatches.length === 0 && (
          <div className="career-empty-state">

            <div className="empty-icon">
              ◌
            </div>

            <h3>
              No active opportunities found
            </h3>

            <p>
              CareerIQ will show job matches here
              when active opportunities are available.
            </p>

          </div>
        )}

      </section>

    </div>
  );
}