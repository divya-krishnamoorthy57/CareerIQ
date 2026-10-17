import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";

interface DashboardData {
  total_students: number;
  total_companies: number;
  active_jobs: number;
  total_applications: number;
  application_status: {
    applied: number;
    shortlisted: number;
    interview: number;
    selected: number;
    rejected: number;
  };
}

function Analytics() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("careeriq_token");

    fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="page-container">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Placement Analytics</h1>
      <p>Overview of CareerIQ application activity.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <strong>{data.total_students}</strong>
        </div>

        <div className="stat-card">
          <h3>Companies</h3>
          <strong>{data.total_companies}</strong>
        </div>

        <div className="stat-card">
          <h3>Active Jobs</h3>
          <strong>{data.active_jobs}</strong>
        </div>

        <div className="stat-card">
          <h3>Applications</h3>
          <strong>{data.total_applications}</strong>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Application Breakdown</h2>

        <div className="status-grid">
          <div>
            Applied: {data.application_status.applied}
          </div>

          <div>
            Shortlisted:{" "}
            {data.application_status.shortlisted}
          </div>

          <div>
            Interview:{" "}
            {data.application_status.interview}
          </div>

          <div>
            Selected: {data.application_status.selected}
          </div>

          <div>
            Rejected: {data.application_status.rejected}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;