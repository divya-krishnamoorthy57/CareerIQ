import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";
import "./profile.css";

interface ProfileData {
  phone: string;
  location: string;
  college: string;
  degree: string;
  department: string;
  graduation_year: string;
  cgpa: string;
  skills: string;
  career_goal: string;
  preferred_job_role: string;
}

const emptyProfile: ProfileData = {
  phone: "",
  location: "",
  college: "",
  degree: "",
  department: "",
  graduation_year: "",
  cgpa: "",
  skills: "",
  career_goal: "",
  preferred_job_role: "",
};

function Profile() {
  const [profile, setProfile] =
    useState<ProfileData>(emptyProfile);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("careeriq_token");

  const getProfileFromStorage = (): ProfileData | null => {
    try {
      const saved = localStorage.getItem(
        "careeriq_profile"
      );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const saveProfileToStorage = (
    data: ProfileData
  ) => {
    localStorage.setItem(
      "careeriq_profile",
      JSON.stringify(data)
    );
  };

  const loadProfile = async () => {
    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load profile from server."
        );
      }

      const data = await response.json();

      console.log("CareerIQ profile loaded:", data);

      const loadedProfile: ProfileData = {
        phone: data?.phone || "",
        location: data?.location || "",
        college: data?.college || "",
        degree: data?.degree || "",
        department: data?.department || "",
        graduation_year:
          data?.graduation_year !== null &&
          data?.graduation_year !== undefined
            ? String(data.graduation_year)
            : "",
        cgpa: data?.cgpa || "",
        skills: data?.skills || "",
        career_goal: data?.career_goal || "",
        preferred_job_role:
          data?.preferred_job_role || "",
      };

      /*
       * If the server has profile data,
       * use it and update local backup.
       */
      const hasServerData = Object.values(
        loadedProfile
      ).some((value) => value.trim() !== "");

      if (hasServerData) {
        setProfile(loadedProfile);
        saveProfileToStorage(loadedProfile);
      } else {
        /*
         * If server returns an empty profile,
         * restore the last saved local profile.
         */
        const localProfile =
          getProfileFromStorage();

        if (localProfile) {
          setProfile(localProfile);
        } else {
          setProfile(emptyProfile);
        }
      }

    } catch (err) {
      console.error(
        "CareerIQ profile loading error:",
        err
      );

      /*
       * If server temporarily fails,
       * restore local saved profile.
       */
      const localProfile =
        getProfileFromStorage();

      if (localProfile) {
        setProfile(localProfile);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!token) {
      setError(
        "Session expired. Please login again."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const profileToSave = {
        ...profile,
        graduation_year:
          profile.graduation_year
            ? Number(profile.graduation_year)
            : null,
      };

      const response = await fetch(
        `${API_BASE_URL}/profile/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileToSave),
        }
      );

      const data = await response.json();

      console.log(
        "CareerIQ profile save response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to update profile."
        );
      }

      /*
       * Save locally as backup.
       */
      saveProfileToStorage(profile);

      /*
       * Immediately reload from backend
       * so we know the saved data is available.
       */
      await loadProfile();

      setMessage(
        "Profile saved successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (err) {
      console.error(
        "CareerIQ profile save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const filledFields = Object.values(
    profile
  ).filter(
    (value) => value.trim() !== ""
  ).length;

  const completion = Math.round(
    (filledFields /
      Object.keys(profile).length) *
      100
  );

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem(
        "careeriq_user"
      ) || "{}"
    );
  } catch {
    user = {};
  }

  const displayName =
    (user as { name?: string }).name ||
    "Student";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  if (loading) {
    return (
      <div className="profile-page">

        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>

          <h2>Loading your profile...</h2>

          <p>
            CareerIQ is retrieving your saved information.
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* SUCCESS NOTIFICATION */}

      {message && (
        <div className="profile-toast success-toast">

          <span className="toast-icon">
            ✓
          </span>

          <div>
            <strong>
              Profile Saved
            </strong>

            <p>
              Your profile has been updated successfully.
            </p>
          </div>

        </div>
      )}

      {/* ERROR NOTIFICATION */}

      {error && (
        <div className="profile-toast error-toast">

          <span className="toast-icon">
            !
          </span>

          <div>
            <strong>
              Profile Error
            </strong>

            <p>
              {error}
            </p>
          </div>

        </div>
      )}

      {/* HEADER */}

      <div className="profile-page-header">

        <div>

          <div className="profile-eyebrow">
            CAREERIQ
          </div>

          <h1>
            My Profile
          </h1>

          <p>
            Keep your academic and career information updated.
          </p>

        </div>

        <div className="profile-completion">

          <span>
            Profile completion
          </span>

          <strong>
            {completion}%
          </strong>

          <div className="completion-bar">

            <div
              style={{
                width: `${completion}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="profile-layout">

        {/* PROFILE CARD */}

        <aside className="profile-sidebar">

          <div className="profile-card">

            <div className="profile-avatar">
              {initial}
            </div>

            <h2>
              {displayName}
            </h2>

            <p className="profile-role">
              CareerIQ Student
            </p>

            <div className="profile-summary">

              <div>

                <span>
                  Preferred Role
                </span>

                <strong>
                  {profile.preferred_job_role ||
                    "Not added"}
                </strong>

              </div>

              <div>

                <span>
                  Career Goal
                </span>

                <strong>
                  {profile.career_goal ||
                    "Not added"}
                </strong>

              </div>

              <div>

                <span>
                  Location
                </span>

                <strong>
                  {profile.location ||
                    "Not added"}
                </strong>

              </div>

              <div>

                <span>
                  Education
                </span>

                <strong>
                  {profile.degree ||
                    "Not added"}
                </strong>

              </div>

            </div>

          </div>

        </aside>

        {/* FORM */}

        <main className="profile-content">

          <form onSubmit={handleSubmit}>

            {/* PERSONAL */}

            <section className="profile-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Your basic contact information.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="Coimbatore"
                  />

                </div>

              </div>

            </section>

            {/* EDUCATION */}

            <section className="profile-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Education
                  </h2>

                  <p>
                    Add your academic background.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div className="form-group form-full">

                  <label>
                    College
                  </label>

                  <input
                    name="college"
                    value={profile.college}
                    onChange={handleChange}
                    placeholder="College / University"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Degree
                  </label>

                  <input
                    name="degree"
                    value={profile.degree}
                    onChange={handleChange}
                    placeholder="MCA"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <input
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="Computer Applications"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Graduation Year
                  </label>

                  <input
                    type="number"
                    name="graduation_year"
                    value={profile.graduation_year}
                    onChange={handleChange}
                    placeholder="2026"
                  />

                </div>

                <div className="form-group">

                  <label>
                    CGPA
                  </label>

                  <input
                    name="cgpa"
                    value={profile.cgpa}
                    onChange={handleChange}
                    placeholder="8.5"
                  />

                </div>

              </div>

            </section>

            {/* CAREER */}

            <section className="profile-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Career Information
                  </h2>

                  <p>
                    This information helps CareerIQ
                    personalize your recommendations.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Career Goal
                  </label>

                  <input
                    name="career_goal"
                    value={profile.career_goal}
                    onChange={handleChange}
                    placeholder="Software Developer"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Preferred Job Role
                  </label>

                  <input
                    name="preferred_job_role"
                    value={profile.preferred_job_role}
                    onChange={handleChange}
                    placeholder="Frontend Developer"
                  />

                </div>

                <div className="form-group form-full">

                  <label>
                    Skills
                  </label>

                  <textarea
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    placeholder="Python, SQL, React, Git..."
                    rows={5}
                  />

                </div>

              </div>

            </section>

            {/* SAVE */}

            <div className="profile-save-area">

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : "Save Profile"}

              </button>

            </div>

          </form>

        </main>

      </div>

    </div>
  );
}

export default Profile;