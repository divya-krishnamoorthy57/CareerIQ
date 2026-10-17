import { useState } from "react";

function CareerIntelligence() {
  const [query, setQuery] = useState("");

  return (
    <div className="page-container">
      <h1>Career Intelligence</h1>

      <p>
        Explore career trends, skills, jobs, and placement
        intelligence.
      </p>

      <div className="analysis-card">
        <label>Search Career Intelligence</label>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: React Developer"
        />

        <button className="primary-button">
          Search
        </button>

        {query && (
          <div className="analysis-result">
            <h2>{query}</h2>

            <p>
              Career intelligence results will be connected to
              the approved career data sources and knowledge base.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerIntelligence;