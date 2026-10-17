import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="careeriq-navbar">
      <div className="careeriq-navbar-inner">

        <NavLink to="/" className="careeriq-logo">
          <span className="careeriq-logo-icon">C</span>
          <span>CareerIQ</span>
        </NavLink>

        <div className="careeriq-nav-links">

          {user?.role === "student" && (
            <>
              <NavLink to="/student/dashboard">
                Dashboard
              </NavLink>

              <NavLink to="/student/profile">
                Profile
              </NavLink>

              <NavLink to="/student/resume">
                Resume Analyzer
              </NavLink>

              <NavLink to="/student/career">
                Career Analysis
              </NavLink>

              <NavLink to="/student/skill-gap">
                Skill Gap
              </NavLink>

              <NavLink to="/student/roadmap">
                Learning Roadmap
              </NavLink>

              <NavLink to="/student/jobs">
                Jobs
              </NavLink>

              <NavLink to="/student/applications">
                Applications
              </NavLink>

              <NavLink to="/student/interview">
                AI Interview
              </NavLink>
            </>
          )}

        </div>

        {user && (
          <div className="careeriq-nav-user">
            <span className="careeriq-user-name">
              {user.name}
            </span>

            <button
              type="button"
              onClick={logout}
              className="careeriq-logout"
            >
              Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;