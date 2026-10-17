import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import API_BASE_URL from "../../services/api";
import "./student-dashboard.css";

interface Profile {
  phone?: string;
  location?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduation_year?: number;
  cgpa?: string;
  skills?: string;
  career_goal?: string;
  preferred_job_role?: string;
}

interface Job {
  id: number;
  company_name?: string;
  title: string;
  location?: string;
  required_skills?: string;
  job_type?: string;
}

interface Application {
  id: number;
  job_title: string;
  status: string;
  applied_at: string;
}

function StudentDashboard() {
  const { user, token } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          profileResponse,
          jobsResponse,
          applicationsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/profile/`, { headers }),
          fetch(`${API_BASE_URL}/jobs/`, { headers }),
          fetch(`${API_BASE_URL}/applications/my`, { headers }),
        ]);

        if (profileResponse.ok) {
  const profileData = await profileResponse.json();

  const serverProfile = {
    phone: profileData?.phone || "",
    location: profileData?.location || "",
    college: profileData?.college || "",
    degree: profileData?.degree || "",
    department: profileData?.department || "",
    graduation_year: profileData?.graduation_year || "",
    cgpa: profileData?.cgpa || "",
    skills: profileData?.skills || "",
    career_goal: profileData?.career_goal || "",
    preferred_job_role:
      profileData?.preferred_job_role || "",
  };

  const hasServerData = Object.values(serverProfile).some(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

  if (hasServerData) {
    setProfile(serverProfile);

    localStorage.setItem(
      "careeriq_profile",
      JSON.stringify(serverProfile)
    );
  } else {
    const savedProfile =
      localStorage.getItem("careeriq_profile");

    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch {
        setProfile(null);
      }
    }
  }
}

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(Array.isArray(jobsData) ? jobsData : []);
        }

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setApplications(
            Array.isArray(applicationsData)
              ? applicationsData
              : []
          );
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const skills = profile?.skills
    ? profile.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  const profileFields = [
    profile?.phone,
    profile?.location,
    profile?.college,
    profile?.degree,
    profile?.department,
    profile?.graduation_year,
    profile?.cgpa,
    profile?.skills,
    profile?.career_goal,
    profile?.preferred_job_role,
  ];

  const completedFields = profileFields.filter(
    (field) =>
      field !== undefined &&
      field !== null &&
      field !== ""
  ).length;

  const profileCompletion = Math.round(
    (completedFields / profileFields.length) * 100
  );

  const formatStatus = (status: string) => {
    if (!status) return "Unknown";

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your CareerIQ dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">

      {/* ================= HERO ================= */}

      <section className="dashboard-hero">
        <div>
          <span className="dashboard-label">
            CAREERIQ DASHBOARD
          </span>

          <h1>
            Welcome back,{" "}
            <span>{user?.name || "Student"}</span>
          </h1>

          <p>
            Track your career progress, discover opportunities,
            and build the skills needed for your target career.
          </p>

          {profile?.preferred_job_role && (
            <div className="career-goal">
              <span>Target role</span>

              <strong>
                {profile.preferred_job_role}
              </strong>
            </div>
          )}
        </div>

        <div className="dashboard-score">
          <div
            className="score-circle"
            style={
              {
                "--progress": `${profileCompletion}%`,
              } as CSSProperties
            }
          >
            <div className="score-inner">
              <strong>
                {profileCompletion}%
              </strong>

              <span>Profile</span>
            </div>
          </div>

          <Link to="/student/profile">
            Complete Profile
          </Link>
        </div>
      </section>

      {/* ================= STATS ================= */}

      <section className="dashboard-stats">

        <div className="dashboard-stat-card">
          <div className="stat-icon purple-icon">
            P
          </div>

          <div>
            <span>Profile</span>

            <strong>
              {profileCompletion}%
            </strong>

            <small>Completed</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon blue-icon">
            S
          </div>

          <div>
            <span>Skills</span>

            <strong>
              {skills.length}
            </strong>

            <small>Added</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon violet-icon">
            J
          </div>

          <div>
            <span>Jobs</span>

            <strong>
              {jobs.length}
            </strong>

            <small>Available</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon indigo-icon">
            A
          </div>

          <div>
            <span>Applications</span>

            <strong>
              {applications.length}
            </strong>

            <small>Submitted</small>
          </div>
        </div>

      </section>

      {/* ================= QUICK ACTIONS ================= */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              NEXT STEPS
            </span>

            <h2>
              Continue your career journey
            </h2>
          </div>
        </div>

        <div className="quick-actions">

          <Link
            to="/student/resume"
            className="quick-action"
          >
            <div className="quick-icon">
              R
            </div>

            <div>
              <h3>Resume Analyzer</h3>

              <p>
                Improve your resume with AI-powered
                insights.
              </p>
            </div>

            <span>→</span>
          </Link>

          <Link
            to="/student/career"
            className="quick-action"
          >
            <div className="quick-icon">
              C
            </div>

            <div>
              <h3>Career Analysis</h3>

              <p>
                Explore roles that match your
                career profile.
              </p>
            </div>

            <span>→</span>
          </Link>

          <Link
            to="/student/skill-gap"
            className="quick-action"
          >
            <div className="quick-icon">
              S
            </div>

            <div>
              <h3>Skill Gap</h3>

              <p>
                Find the skills you need for your
                target role.
              </p>
            </div>

            <span>→</span>
          </Link>

          <Link
            to="/student/roadmap"
            className="quick-action"
          >
            <div className="quick-icon">
              L
            </div>

            <div>
              <h3>Learning Roadmap</h3>

              <p>
                Follow a structured path toward
                your career goal.
              </p>
            </div>

            <span>→</span>
          </Link>

        </div>
      </section>

      {/* ================= APPLICATIONS + SKILLS ================= */}

      <div className="dashboard-columns">

        {/* Applications */}

        <section className="dashboard-panel">

          <div className="panel-header">
            <div>
              <span className="section-label">
                APPLICATIONS
              </span>

              <h2>
                Recent Applications
              </h2>
            </div>

            <Link to="/student/applications">
              View all
            </Link>
          </div>

          {applications.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                A
              </div>

              <h3>
                No applications yet
              </h3>

              <p>
                Explore available jobs and start
                applying.
              </p>

              <Link to="/student/jobs">
                Explore Jobs
              </Link>

            </div>

          ) : (

            <div className="application-list">

              {applications
                .slice(0, 4)
                .map((application) => (

                  <div
                    className="application-item"
                    key={application.id}
                  >

                    <div className="application-icon">
                      J
                    </div>

                    <div className="application-info">

                      <h3>
                        {application.job_title}
                      </h3>

                      <p>
                        Applied{" "}
                        {new Date(
                          application.applied_at
                        ).toLocaleDateString()}
                      </p>

                    </div>

                    <span
                      className={`status-badge status-${application.status}`}
                    >
                      {formatStatus(
                        application.status
                      )}
                    </span>

                  </div>

                ))}

            </div>
          )}

        </section>

        {/* Skills */}

        <section className="dashboard-panel">

          <div className="panel-header">

            <div>
              <span className="section-label">
                YOUR PROFILE
              </span>

              <h2>
                Current Skills
              </h2>
            </div>

            <Link to="/student/profile">
              Edit
            </Link>

          </div>

          {skills.length === 0 ? (

            <div className="empty-state compact">

              <h3>
                No skills added
              </h3>

              <p>
                Add your skills to improve
                career matching.
              </p>

              <Link to="/student/profile">
                Add Skills
              </Link>

            </div>

          ) : (

            <div className="skills-container">

              {skills.map((skill, index) => (

                <span
                  className="skill-chip"
                  key={`${skill}-${index}`}
                >
                  {skill}
                </span>

              ))}

            </div>
          )}

          {profile?.career_goal && (
            <div className="career-goal-box">

              <span>
                Career Goal
              </span>

              <strong>
                {profile.career_goal}
              </strong>

            </div>
          )}

        </section>

      </div>

      {/* ================= JOBS ================= */}

      <section className="dashboard-panel jobs-panel">

        <div className="panel-header">

          <div>
            <span className="section-label">
              OPPORTUNITIES
            </span>

            <h2>
              Available Jobs
            </h2>
          </div>

          <Link to="/student/jobs">
            View all jobs
          </Link>

        </div>

        {jobs.length === 0 ? (

          <div className="empty-state">

            <h3>
              No jobs available
            </h3>

            <p>
              New opportunities will appear
              here when they are added.
            </p>

          </div>

        ) : (

          <div className="job-preview-grid">

            {jobs
              .slice(0, 3)
              .map((job) => (

                <div
                  className="job-preview-card"
                  key={job.id}
                >

                  <div className="job-top">

                    <div className="company-avatar">
                      {(job.company_name || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span className="job-type">
                      {job.job_type ||
                        "Opportunity"}
                    </span>

                  </div>

                  <h3>
                    {job.title}
                  </h3>

                  <p className="company-name">
                    {job.company_name ||
                      "Company"}
                  </p>

                  <p className="job-location">
                    {job.location ||
                      "Location not specified"}
                  </p>

                  {job.required_skills && (
                    <div className="job-skills">

                      {job.required_skills
                        .split(",")
                        .slice(0, 4)
                        .map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                            >
                              {skill.trim()}
                            </span>
                          )
                        )}

                    </div>
                  )}

                  <Link
                    to="/student/jobs"
                    className="job-link"
                  >
                    View Opportunity →
                  </Link>

                </div>

              ))}

          </div>
        )}

      </section>

      {/* ================= BOTTOM CTA ================= */}

      <section className="dashboard-cta">

        <div>

          <span>
            READY FOR THE NEXT STEP?
          </span>

          <h2>
            Build the skills that move your
            career forward.
          </h2>

          <p>
            Use CareerIQ to understand your
            current position and plan your
            next career move.
          </p>

        </div>

        <Link to="/student/career">
          Explore Career Path →
        </Link>

      </section>

    </div>
  );
}

export default StudentDashboard;