from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, StudentProfile
from security import verify_access_token


router = APIRouter(
    prefix="/profile",
    tags=["Student Profile"]
)


security = HTTPBearer()


# ==============================
# PROFILE REQUEST
# ==============================

class ProfileRequest(BaseModel):
    phone: str | None = None
    location: str | None = None
    college: str | None = None
    degree: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    cgpa: str | None = None
    skills: str | None = None
    career_goal: str | None = None
    preferred_job_role: str | None = None


# ==============================
# GET CURRENT USER
# ==============================

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
            detail="Invalid user ID in token"
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


# ==============================
# GET PROFILE
# ==============================

@router.get("/")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.id
        )
        .first()
    )

    # Profile does not exist yet
    if not profile:

        return {
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role
            },
            "profile": None
        }

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        },

        "profile": {
            "id": profile.id,
            "phone": profile.phone,
            "location": profile.location,
            "college": profile.college,
            "degree": profile.degree,
            "department": profile.department,
            "graduation_year": profile.graduation_year,
            "cgpa": profile.cgpa,
            "skills": profile.skills,
            "career_goal": profile.career_goal,
            "preferred_job_role": profile.preferred_job_role
        }
    }


# ==============================
# UPDATE PROFILE
# ==============================

@router.put("/")
def update_profile(
    profile_data: ProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only students can update their profile
    if current_user.role != "student":

        raise HTTPException(
            status_code=403,
            detail="Only students can update their profile"
        )


    # Check whether profile already exists
    profile = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.id
        )
        .first()
    )


    # ==============================
    # CREATE NEW PROFILE
    # ==============================

    if not profile:

        profile = StudentProfile(

            user_id=current_user.id,

            phone=profile_data.phone,

            location=profile_data.location,

            college=profile_data.college,

            degree=profile_data.degree,

            department=profile_data.department,

            graduation_year=profile_data.graduation_year,

            cgpa=profile_data.cgpa,

            skills=profile_data.skills,

            career_goal=profile_data.career_goal,

            preferred_job_role=profile_data.preferred_job_role
        )

        db.add(profile)


    # ==============================
    # UPDATE EXISTING PROFILE
    # ==============================

    else:

        profile.phone = profile_data.phone

        profile.location = profile_data.location

        profile.college = profile_data.college

        profile.degree = profile_data.degree

        profile.department = profile_data.department

        profile.graduation_year = profile_data.graduation_year

        profile.cgpa = profile_data.cgpa

        profile.skills = profile_data.skills

        profile.career_goal = profile_data.career_goal

        profile.preferred_job_role = profile_data.preferred_job_role


    # Save changes
    db.commit()

    db.refresh(profile)


    # ==============================
    # RESPONSE
    # ==============================

    return {

        "message": "Profile updated successfully",

        "profile": {

            "id": profile.id,

            "user_id": profile.user_id,

            "phone": profile.phone,

            "location": profile.location,

            "college": profile.college,

            "degree": profile.degree,

            "department": profile.department,

            "graduation_year": profile.graduation_year,

            "cgpa": profile.cgpa,

            "skills": profile.skills,

            "career_goal": profile.career_goal,

            "preferred_job_role": profile.preferred_job_role
        }
    }


# ==============================
# JWT TOKEN TEST
# ==============================

@router.get("/token-test")
def token_test(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="JWT verification failed"
        )

    return {
        "message": "JWT verification successful",
        "payload": payload
    }