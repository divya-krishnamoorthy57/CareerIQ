from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User, Company, Job, Application
from security import verify_access_token


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)

security = HTTPBearer()


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


@router.get("/dashboard")
def get_admin_dashboard(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # ADMIN ACCESS CHECK
    # -----------------------------------------

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access dashboard statistics"
        )

    # -----------------------------------------
    # BASIC COUNTS
    # -----------------------------------------

    total_students = (
        db.query(User)
        .filter(User.role == "student")
        .count()
    )

    total_companies = (
        db.query(Company)
        .count()
    )

    active_jobs = (
        db.query(Job)
        .filter(Job.status == "active")
        .count()
    )

    total_applications = (
        db.query(Application)
        .count()
    )

    # -----------------------------------------
    # APPLICATION STATUS COUNTS
    # -----------------------------------------

    applied_count = (
        db.query(Application)
        .filter(Application.status == "applied")
        .count()
    )

    shortlisted_count = (
        db.query(Application)
        .filter(Application.status == "shortlisted")
        .count()
    )

    interview_count = (
        db.query(Application)
        .filter(Application.status == "interview")
        .count()
    )

    selected_count = (
        db.query(Application)
        .filter(Application.status == "selected")
        .count()
    )

    rejected_count = (
        db.query(Application)
        .filter(Application.status == "rejected")
        .count()
    )

    # -----------------------------------------
    # RECENT JOBS
    # -----------------------------------------

    recent_jobs = (
        db.query(Job)
        .order_by(Job.id.desc())
        .limit(5)
        .all()
    )

    recent_jobs_data = []

    for job in recent_jobs:

        company = (
            db.query(Company)
            .filter(
                Company.id == job.company_id
            )
            .first()
        )

        application_count = (
            db.query(Application)
            .filter(
                Application.job_id == job.id
            )
            .count()
        )

        recent_jobs_data.append({
            "id": job.id,
            "title": job.title,
            "company_name": (
                company.name
                if company
                else "Unknown Company"
            ),
            "job_type": job.job_type,
            "location": job.location,
            "status": job.status,
            "application_count": application_count
        })

    # -----------------------------------------
    # RECENT APPLICATIONS
    # -----------------------------------------

    recent_applications = (
        db.query(Application)
        .order_by(Application.id.desc())
        .limit(5)
        .all()
    )

    recent_applications_data = []

    for application in recent_applications:

        student = (
            db.query(User)
            .filter(
                User.id == application.student_id
            )
            .first()
        )

        job = (
            db.query(Job)
            .filter(
                Job.id == application.job_id
            )
            .first()
        )

        recent_applications_data.append({
            "id": application.id,
            "student_name": (
                student.name
                if student
                else "Unknown Student"
            ),
            "student_email": (
                student.email
                if student
                else None
            ),
            "job_title": (
                job.title
                if job
                else "Unknown Job"
            ),
            "status": application.status,
            "applied_at": application.applied_at
        })

    # -----------------------------------------
    # RESPONSE
    # -----------------------------------------

    return {
        "total_students": total_students,

        "total_companies": total_companies,

        "active_jobs": active_jobs,

        "total_applications": total_applications,

        "application_status": {
            "applied": applied_count,
            "shortlisted": shortlisted_count,
            "interview": interview_count,
            "selected": selected_count,
            "rejected": rejected_count
        },

        "recent_jobs": recent_jobs_data,

        "recent_applications": recent_applications_data
    }