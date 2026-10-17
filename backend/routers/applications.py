from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, Application, Job, Company
from security import verify_access_token


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)

security = HTTPBearer()


class ApplicationStatusRequest(BaseModel):
    status: str


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


# ------------------------------------------------
# STUDENT - APPLY FOR A JOB
# ------------------------------------------------

@router.post("/{job_id}")
def apply_for_job(
    job_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can apply for jobs"
        )

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

    if job.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This job is no longer active"
        )

    existing_application = (
        db.query(Application)
        .filter(
            Application.student_id == current_user.id,
            Application.job_id == job_id
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    application = Application(
        student_id=current_user.id,
        job_id=job_id,
        status="applied"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully",
        "application_id": application.id,
        "job_id": job_id,
        "status": application.status
    }


# ------------------------------------------------
# STUDENT - VIEW MY APPLICATIONS
# ------------------------------------------------

@router.get("/my")
def get_my_applications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can view their applications"
        )

    applications = (
        db.query(Application)
        .filter(
            Application.student_id == current_user.id
        )
        .order_by(Application.id.desc())
        .all()
    )

    result = []

    for application in applications:

        job = (
            db.query(Job)
            .filter(Job.id == application.job_id)
            .first()
        )

        if not job:
            continue

        company = (
            db.query(Company)
            .filter(Company.id == job.company_id)
            .first()
        )

        result.append({
            "id": application.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_name": (
                company.name
                if company
                else "Unknown Company"
            ),
            "location": job.location,
            "job_type": job.job_type,
            "salary": job.salary,
            "status": application.status,
            "applied_at": application.applied_at,
            "updated_at": application.updated_at
        })

    return result


# ------------------------------------------------
# ADMIN - VIEW ALL APPLICATIONS
# ------------------------------------------------

@router.get("/")
def get_all_applications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view all applications"
        )

    applications = (
        db.query(Application)
        .order_by(Application.id.desc())
        .all()
    )

    result = []

    for application in applications:

        student = (
            db.query(User)
            .filter(User.id == application.student_id)
            .first()
        )

        job = (
            db.query(Job)
            .filter(Job.id == application.job_id)
            .first()
        )

        if not job:
            continue

        company = (
            db.query(Company)
            .filter(Company.id == job.company_id)
            .first()
        )

        result.append({
            "id": application.id,
            "student_id": application.student_id,
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
            "job_id": job.id,
            "job_title": job.title,
            "company_name": (
                company.name
                if company
                else "Unknown Company"
            ),
            "status": application.status,
            "applied_at": application.applied_at,
            "updated_at": application.updated_at
        })

    return result


# ------------------------------------------------
# ADMIN - UPDATE APPLICATION STATUS
# ------------------------------------------------

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update application status"
        )

    allowed_statuses = [
        "applied",
        "shortlisted",
        "interview",
        "selected",
        "rejected"
    ]

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Use: "
                + ", ".join(allowed_statuses)
            )
        )

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    application.status = status_data.status

    db.commit()
    db.refresh(application)

    return {
        "message": "Application status updated successfully",
        "application_id": application.id,
        "status": application.status
    }