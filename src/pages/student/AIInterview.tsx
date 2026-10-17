import { useState } from "react";
import "./ai-interview.css";
import API_BASE_URL from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface Question {
  id: number;
  category: string;
  question: string;
  tip: string;
}

interface EvaluationResult {
  score: number;
  title: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  better_answer: string;
  word_count: number;
  question: string;
  category: string;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Introduction",
    question:
      "Tell me about yourself and your career goals.",
    tip:
      "Keep your answer around 60–90 seconds and connect your skills to the role you want.",
  },
  {
    id: 2,
    category: "JavaScript",
    question:
      "What is the difference between let, const and var in JavaScript?",
    tip:
      "Explain scope, reassignment and why modern JavaScript usually prefers let and const.",
  },
  {
    id: 3,
    category: "React",
    question:
      "What is the purpose of useState in React?",
    tip:
      "Explain state, the setter function and how changing state causes a component to update.",
  },
  {
    id: 4,
    category: "React",
    question:
      "What is the difference between props and state?",
    tip:
      "Mention that props are passed into a component while state is managed by the component.",
  },
  {
    id: 5,
    category: "SQL",
    question:
      "What is the difference between WHERE and HAVING in SQL?",
    tip:
      "Focus on filtering rows versus filtering grouped results.",
  },
  {
    id: 6,
    category: "Git",
    question:
      "Why is Git used in software development?",
    tip:
      "Talk about version control, collaboration, history and safely managing code changes.",
  },
  {
    id: 7,
    category: "Projects",
    question:
      "Explain one project you have built and the problem it solves.",
    tip:
      "Use this structure: problem → technology → your contribution → result.",
  },
  {
    id: 8,
    category: "Career",
    question:
      "Why should a company hire you for this role?",
    tip:
      "Connect your technical skills, projects, learning ability and role requirements.",
  },
];

function AIInterview() {
  const { user, token } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] =
    useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];

  const progress = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  const handleEvaluate = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer first.");
      return;
    }

    if (!token) {
      setError("Please login again.");
      return;
    }

    setEvaluating(true);
    setError("");
    setEvaluation(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/interview/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            answer: answer.trim(),
            category: currentQuestion.category,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to evaluate your answer."
        );
      }

      setEvaluation(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to evaluate your answer."
      );
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setAnswer("");
      setEvaluation(null);
      setError("");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1);
      setAnswer("");
      setEvaluation(null);
      setError("");
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentIndex(index);
    setAnswer("");
    setEvaluation(null);
    setError("");
  };

  const restartInterview = () => {
    setCurrentIndex(0);
    setAnswer("");
    setEvaluation(null);
    setError("");
  };

  return (
    <div className="ai-interview-page">

      <section className="interview-header">
        <div>
          <span className="interview-eyebrow">
            AI INTERVIEW PRACTICE
          </span>

          <h1>
            Practice before
            <br />
            the real interview.
          </h1>

          <p>
            Build confidence with role-focused interview
            questions and intelligent AI feedback.
          </p>
        </div>

        <div className="interview-header-card">
          <span>INTERVIEW PROGRESS</span>

          <strong>
            {currentIndex + 1}/{questions.length}
          </strong>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <small>
            {progress}% completed
          </small>
        </div>
      </section>

      <div className="interview-welcome">
        <span>
          PREPARING {user?.name || "STUDENT"}
        </span>

        <p>
          Answer naturally. CareerIQ analyzes your answer
          for relevance, technical correctness, clarity
          and completeness.
        </p>
      </div>

      <section className="interview-layout">

        <div className="question-card">

          <div className="question-top">
            <span className="question-number">
              QUESTION {currentIndex + 1}
            </span>

            <span className="question-category">
              {currentQuestion.category}
            </span>
          </div>

          <h2>
            {currentQuestion.question}
          </h2>

          <div className="question-tip">
            <strong>
              Interview tip
            </strong>

            <p>
              {currentQuestion.tip}
            </p>
          </div>

          <label htmlFor="interview-answer">
            Your answer
          </label>

          <textarea
            id="interview-answer"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setEvaluation(null);
              setError("");
            }}
            placeholder="Type your interview answer here..."
            rows={8}
          />

          <div className="answer-footer">
            <span>
              {answer.trim()
                ? answer.trim().split(/\s+/).length
                : 0}{" "}
              words
            </span>

            <button
              type="button"
              className="submit-answer"
              onClick={handleEvaluate}
              disabled={
                !answer.trim() || evaluating
              }
            >
              {evaluating
                ? "AI is evaluating..."
                : "Evaluate Answer"}
            </button>
          </div>

          {error && (
            <div className="interview-error">
              {error}
            </div>
          )}

          {evaluation && (
            <div className="interview-feedback">

              <div className="feedback-score">
                <strong>
                  {evaluation.score}
                </strong>

                <span>
                  /100
                </span>
              </div>

              <div className="feedback-content">

                <span>
                  AI EVALUATION
                </span>

                <h3>
                  {evaluation.title}
                </h3>

                <p>
                  {evaluation.feedback}
                </p>

                <small>
                  {evaluation.word_count} words analyzed
                </small>

              </div>

              <div className="ai-feedback-details">

                <div className="ai-feedback-section">
                  <span>
                    STRENGTHS
                  </span>

                  {evaluation.strengths.length > 0 ? (
                    evaluation.strengths.map(
                      (item, index) => (
                        <p key={index}>
                          <b>✓</b>
                          {item}
                        </p>
                      )
                    )
                  ) : (
                    <p>
                      No specific strengths identified.
                    </p>
                  )}
                </div>

                <div className="ai-feedback-section">
                  <span>
                    AREAS TO IMPROVE
                  </span>

                  {evaluation.improvements.length > 0 ? (
                    evaluation.improvements.map(
                      (item, index) => (
                        <p key={index}>
                          <b>+</b>
                          {item}
                        </p>
                      )
                    )
                  ) : (
                    <p>
                      No major improvements identified.
                    </p>
                  )}
                </div>

                <div className="ai-better-answer">
                  <span>
                    BETTER ANSWER
                  </span>

                  <p>
                    {evaluation.better_answer}
                  </p>
                </div>

              </div>

            </div>
          )}

          <div className="question-actions">

            <button
              type="button"
              className="secondary-action"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            {currentIndex === questions.length - 1 ? (

              <button
                type="button"
                className="primary-action"
                onClick={restartInterview}
              >
                Restart Interview
              </button>

            ) : (

              <button
                type="button"
                className="primary-action"
                onClick={handleNext}
              >
                Next Question →
              </button>

            )}

          </div>

        </div>

        <aside className="interview-overview">

          <span className="overview-label">
            INTERVIEW PLAN
          </span>

          <h3>
            Questions
          </h3>

          <div className="question-list">

            {questions.map((question, index) => (

              <button
                type="button"
                key={question.id}
                className={
                  index === currentIndex
                    ? "question-item active"
                    : index < currentIndex
                    ? "question-item completed"
                    : "question-item"
                }
                onClick={() =>
                  handleQuestionSelect(index)
                }
              >

                <span>
                  {index + 1}
                </span>

                <div>
                  <strong>
                    {question.category}
                  </strong>

                  <small>
                    {index < currentIndex
                      ? "Completed"
                      : index === currentIndex
                      ? "Current question"
                      : "Upcoming"}
                  </small>
                </div>

              </button>

            ))}

          </div>

        </aside>

      </section>

    </div>
  );
}

export default AIInterview;