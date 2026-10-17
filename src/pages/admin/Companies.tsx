import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";

interface Company {
  id: number;
  name: string;
  industry?: string;
  location?: string;
  website?: string;
}

function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/companies/`)
      .then((res) => res.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  return (
    <div className="page-container">
      <h1>Companies</h1>
      <p>Companies registered in CareerIQ.</p>

      <div className="job-grid">
        {companies.map((company) => (
          <div className="card" key={company.id}>
            <h2>{company.name}</h2>

            <p>
              <strong>Industry:</strong>{" "}
              {company.industry || "-"}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {company.location || "-"}
            </p>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
              >
                Company Website
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Companies;