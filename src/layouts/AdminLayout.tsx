import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>CareerIQ</h2>

        <nav>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/students">Students</Link>
          <Link to="/admin/companies">Companies</Link>
          <Link to="/admin/jobs">Jobs</Link>
          <Link to="/admin/applications">Applications</Link>
          <Link to="/admin/career-intelligence">
            Career Intelligence
          </Link>
          <Link to="/admin/analytics">Analytics</Link>
        </nav>

        <div className="sidebar-bottom">
          <span>{user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;