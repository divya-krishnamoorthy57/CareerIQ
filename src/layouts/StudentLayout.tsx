import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./student-layout.css";

function StudentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="student-layout">

      <aside className="student-sidebar">

        <div className="student-brand">
          <div className="student-brand-icon">
            C
          </div>

          <div>
            <h2>CareerIQ</h2>
            <span>Career Intelligence</span>
          </div>
        </div>

        <div className="student-nav-title">
          MAIN MENU
        </div>

        <nav className="student-nav">

          <NavLink to="/student/dashboard">
            <span className="nav-icon">D</span>
            Dashboard
          </NavLink>

          <NavLink to="/student/profile">
            <span className="nav-icon">P</span>
            Profile
          </NavLink>

          <NavLink to="/student/resume">
            <span className="nav-icon">R</span>
            Resume Analyzer
          </NavLink>

          <NavLink to="/student/career">
            <span className="nav-icon">C</span>
            Career Analysis
          </NavLink>

          <NavLink to="/student/skill-gap">
            <span className="nav-icon">S</span>
            Skill Gap
          </NavLink>

          <NavLink to="/student/roadmap">
            <span className="nav-icon">L</span>
            Learning Roadmap
          </NavLink>

          <NavLink to="/student/jobs">
            <span className="nav-icon">J</span>
            Jobs
          </NavLink>

          <NavLink to="/student/applications">
            <span className="nav-icon">A</span>
            Applications
          </NavLink>

          <NavLink to="/student/interview">
            <span className="nav-icon">I</span>
            AI Interview
          </NavLink>

        </nav>

        <div className="student-sidebar-bottom">

          <div className="student-user">

            <div className="student-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="student-user-info">
              <strong>{user?.name}</strong>
              <span>Student</span>
            </div>

          </div>

          <button
            type="button"
            className="student-logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="student-main">
        <Outlet />
      </main>

    </div>
  );
}

export default StudentLayout;