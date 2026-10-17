import { useEffect, useState, type ChangeEvent } from "react";
import "./resume-analyzer.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const SAVED_RESUME_KEY = "careeriq_resume_analysis";
const TOKEN_KEY = "careeriq_token";
const PROFILE_KEY = "careeriq_profile";

interface AnalysisResult {
  filename: string;
  score: number;
  summary: string;
  detected_skills: string[];
  strengths: string[];
  improvements: string[];
  text_length: number;
  pages: number;

  ats_score?: number;
  keyword_score?: number;
  content_score?: number;
  readability_score?: number;
  ats_friendly?: boolean;
  changes_required?: number;
  target_role?: string;
}

interface SavedResumeData {
  filename: string;
  target_role: string;
  result: AnalysisResult;
  saved_at: string;
}

interface ProfileData {
  phone?: string;
  location?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduation_year?: string;
  cgpa?: string;
  skills?: string;
  career_goal?: string;
  preferred_job_role?: string;
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);

  const [savedFilename, setSavedFilename] =
    useState("");

  const [targetRole, setTargetRole] =
    useState("");

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // LOAD SAVED ANALYSIS + PROFILE
  // ==========================================

  useEffect(() => {
    // Restore previous resume analysis
    const savedResume =
      localStorage.getItem(SAVED_RESUME_KEY);

    if (savedResume) {
      try {
        const saved: SavedResumeData =
          JSON.parse(savedResume);

        setSavedFilename(
          saved.filename || ""
        );

        setTargetRole(
          saved.target_role || ""
        );

        setResult(
          saved.result || null
        );
      } catch (err) {
        console.error(
          "Failed to restore resume analysis:",
          err
        );

        localStorage.removeItem(
          SAVED_RESUME_KEY
        );
      }
    }

    // Restore preferred job role from Profile
    const profileData =
      localStorage.getItem(PROFILE_KEY);

    if (profileData) {
      try {
        const profile: ProfileData =
          JSON.parse(profileData);

        const role =
          profile.preferred_job_role?.trim() ||
          profile.career_goal?.trim() ||
          "";

        if (role) {
          setTargetRole(role);
        }
      } catch (err) {
        console.error(
          "Failed to load profile:",
          err
        );
      }
    }
  }, []);

  // ==========================================
  // GET PROFILE
  // ==========================================

  const getProfile =
    (): ProfileData | null => {
      const profileData =
        localStorage.getItem(PROFILE_KEY);

      if (!profileData) {
        return null;
      }

      try {
        return JSON.parse(
          profileData
        ) as ProfileData;
      } catch (err) {
        console.error(
          "Profile parsing failed:",
          err
        );

        return null;
      }
    };

  // ==========================================
  // GET TARGET JOB ROLE
  // ==========================================

  const getTargetJobRole =
    (): string => {
      const profile =
        getProfile();

      if (profile) {
        const preferredRole =
          profile.preferred_job_role?.trim();

        if (preferredRole) {
          return preferredRole;
        }

        const careerGoal =
          profile.career_goal?.trim();

        if (careerGoal) {
          return careerGoal;
        }
      }

      return targetRole.trim();
    };

  // ==========================================
  // SAVE ANALYSIS
  // ==========================================

  const saveAnalysis = (
    analysis: AnalysisResult,
    filename: string,
    role: string
  ) => {
    const savedData: SavedResumeData = {
      filename,
      target_role: role,
      result: analysis,
      saved_at:
        new Date().toISOString(),
    };

    localStorage.setItem(
      SAVED_RESUME_KEY,
      JSON.stringify(savedData)
    );

    setSavedFilename(filename);
    setTargetRole(role);
    setResult(analysis);
  };

  // ==========================================
  // FILE SELECT
  // ==========================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");

    const isPdf =
      selectedFile.type ===
        "application/pdf" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      setError(
        "Please upload a PDF resume."
      );

      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  // ==========================================
  // REMOVE SELECTED FILE
  // ==========================================

  const removeSelectedFile = () => {
    setFile(null);

    const input =
      document.getElementById(
        "resume-file-input"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  // ==========================================
  // ANALYZE RESUME
  // ==========================================

  const handleAnalyze = async () => {
    if (!file) {
      setError(
        "Please select a PDF resume first."
      );

      return;
    }

    const token =
      localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError(
        "Please login before analyzing your resume."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const roleToAnalyze =
        getTargetJobRole();

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      // Send target job role to backend
      if (roleToAnalyze) {
        formData.append(
          "target_role",
          roleToAnalyze
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/resume/analyze`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      if (!response.ok) {
        let message =
          "Resume analysis failed.";

        try {
          const errorData =
            await response.json();

          if (errorData?.detail) {
            message =
              typeof errorData.detail ===
              "string"
                ? errorData.detail
                : JSON.stringify(
                    errorData.detail
                  );
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      // ==========================================
      // NORMALIZE BACKEND RESPONSE
      // ==========================================

      const analysis: AnalysisResult = {
        filename:
          data.filename ||
          file.name,

        score: Number(
          data.score ??
            data.ats_score ??
            0
        ),

        summary:
          data.summary || "",

        detected_skills:
          Array.isArray(
            data.detected_skills
          )
            ? data.detected_skills
            : [],

        strengths:
          Array.isArray(
            data.strengths
          )
            ? data.strengths
            : [],

        improvements:
          Array.isArray(
            data.improvements
          )
            ? data.improvements
            : [],

        text_length:
          Number(
            data.text_length ?? 0
          ),

        pages:
          Number(
            data.pages ?? 1
          ),

        ats_score:
          data.ats_score !==
          undefined
            ? Number(
                data.ats_score
              )
            : undefined,

        keyword_score:
          data.keyword_score !==
          undefined
            ? Number(
                data.keyword_score
              )
            : undefined,

        content_score:
          data.content_score !==
          undefined
            ? Number(
                data.content_score
              )
            : undefined,

        readability_score:
          data.readability_score !==
          undefined
            ? Number(
                data.readability_score
              )
            : undefined,

        ats_friendly:
          data.ats_friendly !==
          undefined
            ? Boolean(
                data.ats_friendly
              )
            : undefined,

        changes_required:
          data.changes_required !==
          undefined
            ? Number(
                data.changes_required
              )
            : undefined,

        target_role:
          data.target_role ||
          roleToAnalyze,
      };

      // ==========================================
      // SAVE ANALYSIS
      // ==========================================

      saveAnalysis(
        analysis,
        file.name,
        roleToAnalyze
      );

      // Clear newly selected file
      setFile(null);

      const input =
        document.getElementById(
          "resume-file-input"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (err) {
      console.error(
        "Resume analysis error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the resume."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REMOVE SAVED RESUME
  // ==========================================

  const clearSavedResume = () => {
    localStorage.removeItem(
      SAVED_RESUME_KEY
    );

    setResult(null);
    setSavedFilename("");
    setTargetRole("");
    setFile(null);
    setError("");

    const input =
      document.getElementById(
        "resume-file-input"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  // ==========================================
  // SCORE HELPER
  // ==========================================

  const getScore = (
    value: number | undefined
  ): number => {
    if (
      value === undefined ||
      Number.isNaN(value)
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="resume-analyzer-page">

      {/* HEADER */}

      <div className="resume-header">

        <span>
          CAREERIQ RESUME ANALYZER
        </span>

        <h1>
          Analyze your resume with confidence
        </h1>

        <p>
          Upload your resume to evaluate ATS
          compatibility, keyword optimization,
          content quality, readability, and
          career alignment.
        </p>

      </div>

      {/* UPLOAD CARD */}

      <div className="resume-upload-card">

        <div className="upload-icon">
          PDF
        </div>

        <h2>
          {result
            ? "Analyze a New Resume"
            : "Upload Your Resume"}
        </h2>

        <p>
          Upload your latest resume in PDF
          format.
        </p>

        <label
          htmlFor="resume-file-input"
          className="choose-file-button"
        >
          Choose Resume
        </label>

        <input
          id="resume-file-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{
            display: "none",
          }}
        />

        {/* SELECTED FILE */}

        {file && (
          <div className="selected-file">

            <div>

              <strong>
                {file.name}
              </strong>

              <span>
                PDF resume selected
              </span>

            </div>

            <button
              type="button"
              onClick={
                removeSelectedFile
              }
            >
              Remove
            </button>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="resume-error">
            {error}
          </div>
        )}

        {/* ANALYZE BUTTON */}

        <button
          type="button"
          className="analyze-button"
          onClick={
            handleAnalyze
          }
          disabled={
            !file || loading
          }
        >
          {loading
            ? "Analyzing Resume..."
            : "Analyze Resume"}
        </button>

      </div>

      {/* RESULTS */}

      {result && (
        <div className="resume-results">

          {/* RESULTS HEADER */}

          <div className="results-heading">

            <span>
              ANALYSIS COMPLETE
            </span>

            <h2>
              Your Resume Analysis
            </h2>

            <p>
              {targetRole
                ? `Analyzed for ${targetRole}`
                : "Resume analysis results"}
            </p>

          </div>

          {/* MAIN SCORE */}

          <div className="resume-score-card">

            <div className="score-circle">

              <strong>
                {getScore(
                  result.score
                )}
                %
              </strong>

              <span>
                Overall Score
              </span>

            </div>

            <div>

              <span className="score-label">
                RESUME SCORE
              </span>

              <h3>
                {savedFilename}
              </h3>

              <p>
                {result.summary ||
                  "Your resume has been analyzed based on ATS compatibility, keywords, content and readability."}
              </p>

              <div className="resume-meta">

                {result.pages}{" "}
                page
                {result.pages !== 1
                  ? "s"
                  : ""}

                {" • "}

                {result.text_length}{" "}
                characters

                {targetRole && (
                  <>
                    {" • "}
                    Target role:{" "}
                    {targetRole}
                  </>
                )}

              </div>

            </div>

          </div>

          {/* SCORE CARDS */}

          <div className="resume-result-grid">

            {/* ATS */}

            <div className="result-card">

              <span>
                ATS COMPATIBILITY
              </span>

              <h3>
                {getScore(
                  result.ats_score
                )}
                %
              </h3>

              <div className="result-list">

                <div>
                  <b>✓</b>

                  <p>
                    ATS compatibility score
                    based on your resume.
                  </p>
                </div>

                <div>
                  <b>✓</b>

                  <p>
                    Higher scores indicate
                    better ATS compatibility.
                  </p>
                </div>

              </div>

            </div>

            {/* KEYWORDS */}

            <div className="result-card">

              <span>
                KEYWORD OPTIMIZATION
              </span>

              <h3>
                {getScore(
                  result.keyword_score
                )}
                %
              </h3>

              <div className="result-list">

                <div>
                  <b>✓</b>

                  <p>
                    Job-relevant keywords
                    detected in your resume.
                  </p>
                </div>

                <div>
                  <b>✓</b>

                  <p>
                    Keyword optimization is
                    based on your target role.
                  </p>
                </div>

              </div>

            </div>

            {/* CONTENT */}

            <div className="result-card">

              <span>
                CONTENT QUALITY
              </span>

              <h3>
                {getScore(
                  result.content_score
                )}
                %
              </h3>

              <div className="result-list">

                <div>
                  <b>✓</b>

                  <p>
                    Projects, education and
                    experience are evaluated.
                  </p>
                </div>

                <div>
                  <b>✓</b>

                  <p>
                    Add measurable
                    achievements where
                    possible.
                  </p>
                </div>

              </div>

            </div>

            {/* READABILITY */}

            <div className="result-card">

              <span>
                READABILITY
              </span>

              <h3>
                {getScore(
                  result.readability_score
                )}
                %
              </h3>

              <div className="result-list">

                <div>
                  <b>✓</b>

                  <p>
                    Resume structure and
                    readable content were
                    evaluated.
                  </p>
                </div>

                <div>
                  <b>✓</b>

                  <p>
                    Keep sections clear and
                    easy to scan.
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* STRENGTHS + IMPROVEMENTS */}

          <div className="resume-result-grid">

            {/* STRENGTHS */}

            <div className="result-card">

              <span>
                STRENGTHS
              </span>

              <h3>
                What is working well
              </h3>

              <div className="result-list">

                {result.strengths.length >
                0 ? (

                  result.strengths.map(
                    (
                      strength,
                      index
                    ) => (

                      <div
                        key={index}
                      >

                        <b>
                          ✓
                        </b>

                        <p>
                          {strength}
                        </p>

                      </div>

                    )
                  )

                ) : (

                  <div>

                    <b>
                      —
                    </b>

                    <p>
                      No strengths detected
                      yet.
                    </p>

                  </div>

                )}

              </div>

            </div>

            {/* IMPROVEMENTS */}

            <div className="result-card">

              <span>
                IMPROVEMENTS
              </span>

              <h3>
                What you can improve
              </h3>

              <div className="result-list">

                {result.improvements.length >
                0 ? (

                  result.improvements.map(
                    (
                      improvement,
                      index
                    ) => (

                      <div
                        key={index}
                      >

                        <b>
                          !
                        </b>

                        <p>
                          {improvement}
                        </p>

                      </div>

                    )
                  )

                ) : (

                  <div>

                    <b>
                      ✓
                    </b>

                    <p>
                      No major improvements
                      detected.
                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>

          {/* DETECTED SKILLS */}

          <div className="skills-card">

            <div>

              <span>
                DETECTED SKILLS
              </span>

              <h3>
                Skills found in your resume
              </h3>

            </div>

            <div className="skill-tags">

              {result.detected_skills.length >
              0 ? (

                result.detected_skills.map(
                  (
                    skill,
                    index
                  ) => (

                    <span
                      key={index}
                    >
                      {skill}
                    </span>

                  )
                )

              ) : (

                <span className="no-skills">
                  No skills detected
                </span>

              )}

            </div>

          </div>

          {/* REMOVE SAVED ANALYSIS */}

          <div
            style={{
              marginTop: "24px",
              textAlign: "right",
            }}
          >

            <button
              type="button"
              onClick={
                clearSavedResume
              }
              style={{
                border: "none",
                background:
                  "transparent",
                color: "#ef4444",
                fontWeight: 700,
                cursor: "pointer",
                padding: "10px",
              }}
            >
              Remove Saved Resume
            </button>

          </div>

        </div>
      )}

    </div>
  );
}