from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User, StudentProfile, Job
from security import verify_access_token


router = APIRouter(
    prefix="/career",
    tags=["Career Intelligence"]
)

security = HTTPBearer()


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# ==========================================
# HELPER - NORMALIZE SKILL
# ==========================================

def normalize_skill(skill: str) -> str:
    """
    Normalize skills so variations such as
    React.js and React can be matched.
    """

    skill = skill.strip().lower()

    aliases = {
        "react.js": "react",
        "reactjs": "react",

        "node.js": "node",
        "nodejs": "node",

        "express.js": "express",
        "expressjs": "express",

        "javascript": "javascript",
        "js": "javascript",

        "typescript": "typescript",
        "ts": "typescript",

        "postgres": "postgresql",

        "machine-learning": "machine learning",
        "ml": "machine learning",

        "artificial-intelligence": "artificial intelligence",
        "ai": "artificial intelligence",

        "github": "github",
        "git hub": "github"
    }

    return aliases.get(
        skill,
        skill
    )


# ==========================================
# HELPER - GET STUDENT SKILLS
# ==========================================

def get_student_skills(profile: StudentProfile):

    if not profile.skills:
        return []

    return [
        skill.strip()
        for skill in profile.skills.split(",")
        if skill.strip()
    ]


# ==========================================
# HELPER - GET JOB REQUIRED SKILLS
# ==========================================

def get_required_skills(job: Job):

    if not job.required_skills:
        return []

    return [
        skill.strip()
        for skill in job.required_skills.split(",")
        if skill.strip()
    ]


# ==========================================
# SKILL GAP ANALYSIS
# ==========================================

@router.get("/skill-gap/{job_id}")
def skill_gap_analysis(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Only students can use this analysis
    # --------------------------------------

    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can use skill gap analysis"
        )

    # --------------------------------------
    # Find student's profile
    # --------------------------------------

    profile = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found. Please complete your profile first."
        )

    # --------------------------------------
    # Find selected job
    # --------------------------------------

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # --------------------------------------
    # Student skills
    # --------------------------------------

    student_skills = get_student_skills(profile)

    # --------------------------------------
    # Required skills
    # --------------------------------------

    required_skills = get_required_skills(job)

    # --------------------------------------
    # Normalized student skill map
    # --------------------------------------

    student_skill_map = {
        normalize_skill(skill): skill
        for skill in student_skills
    }

    matched_skills = []
    missing_skills = []

    for required_skill in required_skills:

        normalized_required = normalize_skill(
            required_skill
        )

        if normalized_required in student_skill_map:

            matched_skills.append(
                required_skill
            )

        else:

            missing_skills.append(
                required_skill
            )

    # --------------------------------------
    # Calculate percentage
    # --------------------------------------

    total_required = len(required_skills)
    total_matched = len(matched_skills)

    if total_required > 0:

        match_percentage = round(
            (total_matched / total_required) * 100
        )

    else:

        match_percentage = 0

    # --------------------------------------
    # Return analysis
    # --------------------------------------

    return {
        "student": {
            "id": current_user.id,
            "name": current_user.name
        },

        "job": {
            "id": job.id,
            "title": job.title,
            "required_skills": required_skills
        },

        "analysis": {
            "total_required_skills": total_required,
            "matched_count": total_matched,
            "missing_count": len(missing_skills),
            "match_percentage": match_percentage,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        }
    }


# ==========================================
# JOB MATCH ANALYSIS
# ==========================================

@router.get("/job-match/{job_id}")
def job_match_analysis(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Only students can use job matching
    # --------------------------------------

    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can use job matching"
        )

    # --------------------------------------
    # Find student profile
    # --------------------------------------

    profile = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found. Please complete your profile first."
        )

    # --------------------------------------
    # Find job
    # --------------------------------------

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # --------------------------------------
    # Get skills
    # --------------------------------------

    student_skills = get_student_skills(profile)

    required_skills = get_required_skills(job)

    # --------------------------------------
    # Normalize student skills
    # --------------------------------------

    student_skill_map = {
        normalize_skill(skill): skill
        for skill in student_skills
    }

    matched_skills = []
    missing_skills = []

    # --------------------------------------
    # Compare skills
    # --------------------------------------

    for required_skill in required_skills:

        normalized_required = normalize_skill(
            required_skill
        )

        if normalized_required in student_skill_map:

            matched_skills.append(
                required_skill
            )

        else:

            missing_skills.append(
                required_skill
            )

    # --------------------------------------
    # Calculate match percentage
    # --------------------------------------

    total_required = len(required_skills)
    matched_count = len(matched_skills)
    missing_count = len(missing_skills)

    if total_required > 0:

        match_percentage = round(
            (
                matched_count /
                total_required
            ) * 100
        )

    else:

        match_percentage = 0

    # --------------------------------------
    # Match level
    # --------------------------------------

    if match_percentage >= 80:

        match_level = "Excellent Match"

    elif match_percentage >= 60:

        match_level = "Good Match"

    elif match_percentage >= 40:

        match_level = "Moderate Match"

    else:

        match_level = "Low Match"

    # --------------------------------------
    # Recommendation
    # --------------------------------------

    if match_percentage >= 80:

        recommendation = (
            "You have a strong skill match for this job. "
            "You can consider applying now."
        )

    elif match_percentage >= 60:

        recommendation = (
            "You have a good skill match. "
            "Improve the missing skills to increase your chances."
        )

    elif match_percentage >= 40:

        recommendation = (
            "You have a moderate skill match. "
            "Focus on the missing skills before applying."
        )

    else:

        recommendation = (
            "Several required skills are missing. "
            "Follow a learning roadmap before targeting this role."
        )

    # --------------------------------------
    # Return result
    # --------------------------------------

    return {

        "student": {
            "id": current_user.id,
            "name": current_user.name
        },

        "job": {
            "id": job.id,
            "title": job.title,
            "location": job.location,
            "company_id": job.company_id
        },

        "match": {

            "percentage": match_percentage,

            "level": match_level,

            "total_required_skills":
                total_required,

            "matched_count":
                matched_count,

            "missing_count":
                missing_count,

            "matched_skills":
                matched_skills,

            "missing_skills":
                missing_skills,

            "recommendation":
                recommendation
        }
    }