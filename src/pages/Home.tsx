import { Link } from "react-router-dom";
import "./home.css";

function Home() {
  return (
    <div className="cq-home">

      {/* HERO */}
      <section className="cq-hero">
        <div className="cq-container cq-hero-grid">

          <div className="cq-hero-content">
            <div className="cq-badge">
              <span className="cq-badge-dot"></span>
              AI-Powered Career Intelligence
            </div>

            <h1>
              Build Your Career
              <span>With Intelligence</span>
            </h1>

            <p>
              CareerIQ helps students understand their skills, discover
              relevant career opportunities, identify skill gaps, and prepare
              for placements using AI-powered career intelligence.
            </p>

            <div className="cq-hero-actions">
              <Link to="/register" className="cq-btn cq-btn-primary">
                Get Started
              </Link>

              <a href="#features" className="cq-btn cq-btn-outline">
                Explore Features
              </a>
            </div>

            <div className="cq-trust">
              <div>
                <strong>AI</strong>
                <span>Career Analysis</span>
              </div>

              <div>
                <strong>Smart</strong>
                <span>Skill Matching</span>
              </div>

              <div>
                <strong>Real</strong>
                <span>Job Opportunities</span>
              </div>
            </div>
          </div>

          {/* CAREER MATCH CARD */}
          <div className="cq-visual">
            <div className="cq-glow"></div>

            <div className="cq-career-card">

              <div className="cq-card-top">
                <div>
                  <span className="cq-small-label">
                    CAREER INTELLIGENCE
                  </span>
                  <h3>Career Match</h3>
                </div>

                <div className="cq-live">
                  <span></span>
                  Live
                </div>
              </div>

              <div className="cq-match-area">

                <div className="cq-circle">
                  <div className="cq-circle-inner">
                    <strong>85%</strong>
                    <span>Match</span>
                  </div>
                </div>

                <div className="cq-job-info">
                  <span className="cq-match-label">
                    Recommended Role
                  </span>

                  <h2>Software Developer</h2>

                  <p>
                    Based on your skills and career profile
                  </p>

                  <div className="cq-progress">
                    <div></div>
                  </div>
                </div>

              </div>

              <div className="cq-skill-title">
                Matching Skills
              </div>

              <div className="cq-skills">
                <span>React</span>
                <span>Python</span>
                <span>SQL</span>
                <span>Git</span>
              </div>

            </div>

            <div className="cq-floating cq-floating-one">
              <span>✓</span>
              Skill Gap Identified
            </div>

            <div className="cq-floating cq-floating-two">
              <span>AI</span>
              Career Insights
            </div>
          </div>

        </div>
      </section>


      {/* FEATURES */}
      <section className="cq-section cq-features" id="features">
        <div className="cq-container">

          <div className="cq-section-heading">
            <div className="cq-section-tag">
              CAREER INTELLIGENCE PLATFORM
            </div>

            <h2>
              Everything You Need to
              <span> Build Your Career</span>
            </h2>

            <p>
              One intelligent platform to understand your skills, discover
              opportunities, close skill gaps, and prepare for placements.
            </p>
          </div>

          <div className="cq-feature-grid">

            <div className="cq-feature-card">
              <div className="cq-feature-number">01</div>

              <div className="cq-feature-icon">
                ✦
              </div>

              <h3>AI Career Analysis</h3>

              <p>
                Analyze your skills, interests, education, and career goals
                to understand suitable career directions.
              </p>

              <span className="cq-feature-link">
                Explore career paths →
              </span>
            </div>

            <div className="cq-feature-card">
              <div className="cq-feature-number">02</div>

              <div className="cq-feature-icon">
                ◇
              </div>

              <h3>Skill Gap Analysis</h3>

              <p>
                Compare your current skills with real job requirements and
                identify exactly what you need to improve.
              </p>

              <span className="cq-feature-link">
                Find your skill gaps →
              </span>
            </div>

            <div className="cq-feature-card">
              <div className="cq-feature-number">03</div>

              <div className="cq-feature-icon">
                ↗
              </div>

              <h3>Job Opportunities</h3>

              <p>
                Discover relevant jobs and internships based on your skills,
                preferred roles, and career goals.
              </p>

              <span className="cq-feature-link">
                Discover opportunities →
              </span>
            </div>

            <div className="cq-feature-card">
              <div className="cq-feature-number">04</div>

              <div className="cq-feature-icon">
                ◎
              </div>

              <h3>Interview Preparation</h3>

              <p>
                Practice technical and placement interviews with structured
                preparation and personalized guidance.
              </p>

              <span className="cq-feature-link">
                Prepare for interviews →
              </span>
            </div>

          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="cq-section cq-process" id="how-it-works">
        <div className="cq-container">

          <div className="cq-section-heading">
            <div className="cq-section-tag">
              HOW CAREERIQ WORKS
            </div>

            <h2>
              Your Career Journey,
              <span> Simplified</span>
            </h2>

            <p>
              From understanding your profile to preparing for your dream
              opportunity.
            </p>
          </div>

          <div className="cq-process-grid">

            <div className="cq-process-card">
              <div className="cq-process-icon">01</div>

              <h3>Create Your Profile</h3>

              <p>
                Add your education, skills, projects, certifications, and
                career preferences.
              </p>
            </div>

            <div className="cq-process-line"></div>

            <div className="cq-process-card">
              <div className="cq-process-icon">02</div>

              <h3>Analyze Your Skills</h3>

              <p>
                CareerIQ analyzes your profile and identifies strengths,
                suitable roles, and skill gaps.
              </p>
            </div>

            <div className="cq-process-line"></div>

            <div className="cq-process-card">
              <div className="cq-process-icon">03</div>

              <h3>Discover Opportunities</h3>

              <p>
                Find jobs and internships that match your skills and career
                preferences.
              </p>
            </div>

            <div className="cq-process-line"></div>

            <div className="cq-process-card">
              <div className="cq-process-icon">04</div>

              <h3>Prepare & Apply</h3>

              <p>
                Follow your roadmap, prepare for interviews, and track your
                applications.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="cq-cta">
        <div className="cq-container">
          <div className="cq-cta-box">

            <div className="cq-cta-content">
              <div className="cq-section-tag">
                START YOUR JOURNEY
              </div>

              <h2>
                Turn Your Skills Into
                <span> Career Opportunities</span>
              </h2>

              <p>
                Build your profile, understand your career direction, and
                prepare for your next opportunity with CareerIQ.
              </p>
            </div>

            <Link to="/register" className="cq-btn cq-btn-white">
              Create Your CareerIQ Account
              <span>→</span>
            </Link>

          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;