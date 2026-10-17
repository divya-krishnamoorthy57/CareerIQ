import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginUser({
        email,
        password,
      });

      login(result.user, result.access_token);

      if (result.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <main className="login-container">

        <div className="login-intro">

          <div className="login-logo">
            <span>C</span>
          </div>

          <div>
            <span className="login-brand-name">
              CareerIQ
            </span>

            <span className="login-brand-subtitle">
              Career Intelligence Platform
            </span>
          </div>

        </div>

        <section className="login-card">

          <div className="login-heading">

            <span className="login-small-title">
              WELCOME BACK
            </span>

            <h1>Sign in to CareerIQ</h1>

            <p>
              Continue building your career with
              personalized opportunities and insights.
            </p>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="login-field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />

            </div>

            <div className="login-field">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <div className="login-register">

            <span>
              Don't have a CareerIQ account?
            </span>

            <Link to="/register">
              Create an account
            </Link>

          </div>

        </section>

        <div className="login-bottom">

          <span className="bottom-dot" />

          AI-powered career and placement intelligence

        </div>

      </main>

    </div>
  );
}

export default Login;