import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";

interface Application {
  id: number;
  student_name: string;
  student_email: string;
  job_title: string;
  status: string;
  applied_at: string;
}

function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);

  const loadApplications = () => {
    const token = localStorage.getItem("careeriq_token");

    fetch(`${API_BASE_URL}/applications/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setApplications)
      .catch(() => {});
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (
    id: number,
    status: string
  ) => {
    const token = localStorage.getItem("careeriq_token");

    await fetch(
      `${API_BASE_URL}/applications/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    loadApplications();
  };

  return (
    <div className="page-container">
      <h1>Applications</h1>
      <p>Monitor student job applications.</p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Job</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.student_name}</td>
                <td>{application.student_email}</td>
                <td>{application.job_title}</td>

                <td>
                  <select
                    value={application.status}
                    onChange={(e) =>
                      updateStatus(
                        application.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">
                      Shortlisted
                    </option>
                    <option value="interview">
                      Interview
                    </option>
                    <option value="selected">
                      Selected
                    </option>
                    <option value="rejected">
                      Rejected
                    </option>
                  </select>
                </td>

                <td>
                  {new Date(
                    application.applied_at
                  ).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <p>No applications found.</p>
        )}
      </div>
    </div>
  );
}

export default Applications;