import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/student/StudentDashboard";
import Profile from "./pages/student/Profile";
import ResumeAnalyzer from "./pages/student/ResumeAnalyzer";
import CareerAnalysis from "./pages/student/CareerAnalysis";
import SkillGap from "./pages/student/SkillGap";
import LearningRoadmap from "./pages/student/LearningRoadmap";
import Jobs from "./pages/student/Jobs";
import Applications from "./pages/student/Applications";
import AIInterview from "./pages/student/AIInterview";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import Companies from "./pages/admin/Companies";
import AdminJobs from "./pages/admin/Jobs";
import AdminApplications from "./pages/admin/Applications";
import CareerIntelligence from "./pages/admin/CareerIntelligence";
import Analytics from "./pages/admin/Analytics";

function App() {
  return (
    <Routes>

      {/* PUBLIC PAGES */}

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>


      {/* STUDENT PAGES */}

      <Route
        element={<ProtectedRoute role="student" />}
      >
        <Route
          element={<StudentLayout />}
        >
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />

          <Route
            path="/student/profile"
            element={<Profile />}
          />

          <Route
            path="/student/resume"
            element={<ResumeAnalyzer />}
          />

          <Route
            path="/student/career"
            element={<CareerAnalysis />}
          />

          <Route
            path="/student/skill-gap"
            element={<SkillGap />}
          />

          <Route
            path="/student/roadmap"
            element={<LearningRoadmap />}
          />

          <Route
            path="/student/jobs"
            element={<Jobs />}
          />

          <Route
            path="/student/applications"
            element={<Applications />}
          />

          <Route
            path="/student/interview"
            element={<AIInterview />}
          />
        </Route>
      </Route>


      {/* ADMIN PAGES */}

      <Route
        element={<ProtectedRoute role="admin" />}
      >
        <Route
          element={<AdminLayout />}
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/students"
            element={<Students />}
          />

          <Route
            path="/admin/companies"
            element={<Companies />}
          />

          <Route
            path="/admin/jobs"
            element={<AdminJobs />}
          />

          <Route
            path="/admin/applications"
            element={<AdminApplications />}
          />

          <Route
            path="/admin/career-intelligence"
            element={<CareerIntelligence />}
          />

          <Route
            path="/admin/analytics"
            element={<Analytics />}
          />
        </Route>
      </Route>

    </Routes>
  );
}

export default App;
