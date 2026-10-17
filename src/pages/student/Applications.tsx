import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";
import "./applications.css";

interface Application {
  id: number;
  job_title: string;
  status: string;
  applied_at: string;
}

function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("careeriq_token");

    fetch(`${API_BASE_URL}/applications/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load applications");
        }

        return res.json();
      })
      .then(setApplications)
      .catch(() => {
        setApplications([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getStatusClass = (status: string) => {
    return status.toLowerCase().replace(/\s+/g, "-");
  };

  return (
    <div className="applications-page">
      {/* Header */}
      <div className="applications-header">
        <div>
          <span className="applications-eyebrow">
            APPLICATION TRACKER
          </span>

          <h1>My Applications</h1>

          <p>
            Track the jobs you have applied for and monitor your
            application progress.
          </p>
        </div>

        <div className="application-count">
          <strong>{applications.length}</strong>
          <span>Applications</span>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="applications-empty">
          <p>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="applications-empty">
          <div className="empty-icon">📄</div>

          <h3>No applications yet</h3>

          <p>
            Once you apply for a job, your applications will appear
            here.
          </p>
        </div>
      ) : (
        /* Application Cards */
        <div className="application-list">
          {applications.map((application) => (
            <div
              className="application-card"
              key={application.id}
            >
              <div className="application-main">
                <div className="application-icon">
                  {application.job_title
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="application-info">
                  <h3>{application.job_title}</h3>

                  <p>
                    Applied on{" "}
                    {new Date(
                      application.applied_at
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="application-right">
                <span
                  className={`status ${getStatusClass(
                    application.status
                  )}`}
                >
                  {application.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;