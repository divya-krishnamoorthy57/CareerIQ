from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User, Job, Company
from security import verify_access_token
from services.job_sync_service import sync_jobs_from_adzuna


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)

security = HTTPBearer()


# ============================================================
# REQUEST MODEL
# ============================================================

class JobRequest(BaseModel):
    company_id: int
    title: str
    location: str
    description: str = ""
    required_skills: str = ""
    salary: str = ""
    job_type: str = "Full-time"
    application_deadline: datetime | None = None
    source_name: str = ""
    source_url: str = ""
    application_url: str = ""
    published_date: datetime | None = None
    last_checked_at: datetime | None = None
    status: str = "active"


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    # Your security.py stores the user ID in "sub"
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token."
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )

    return user


# ============================================================
# SYNC JOBS FROM ADZUNA
# IMPORTANT: KEEP THIS BEFORE /{job_id}
# ============================================================

@router.post("/sync")
def sync_jobs(
    search_term: str = "software developer",
    location: str = "India",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    try:

        result = sync_jobs_from_adzuna(
            db=db,
            search_term=search_term,
            location=location,
            results_per_page=20,
            max_pages=5
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Job synchronization failed: {str(e)}"
        )


# ============================================================
# GET ALL JOBS
# ============================================================

@router.get("/")
def get_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    jobs = (
        db.query(Job)
        .order_by(Job.id.desc())
        .all()
    )

    result = []

    for job in jobs:

        company = (
            db.query(Company)
            .filter(Company.id == job.company_id)
            .first()
        )

        result.append({

            "id": job.id,

            "company_id": job.company_id,

            "company": {
                "id": company.id if company else None,

                "name": (
                    company.name
                    if company
                    else "Unknown Company"
                ),

                "industry": (
                    company.industry
                    if company
                    else ""
                ),

                "location": (
                    company.location
                    if company
                    else ""
                ),

                "website": (
                    company.website
                    if company
                    else ""
                )
            },

            "title": job.title,

            "location": job.location,

            "description": job.description or "",

            "required_skills": job.required_skills or "",

            "salary": job.salary or "",

            "job_type": job.job_type or "Full-time",

            "application_deadline": job.application_deadline,

            "source_name": job.source_name or "",

            "source_url": job.source_url or "",

            "application_url": (
                job.application_url
                if getattr(job, "application_url", None)
                else job.source_url
            ),

            "published_date": job.published_date,

            "last_checked_at": job.last_checked_at,

            "status": job.status or "active",

            "created_at": job.created_at
        })

    return result


# ============================================================
# GET SINGLE JOB
# ============================================================

@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    company = (
        db.query(Company)
        .filter(Company.id == job.company_id)
        .first()
    )

    return {

        "id": job.id,

        "company_id": job.company_id,

        "company": {
            "id": company.id if company else None,

            "name": (
                company.name
                if company
                else "Unknown Company"
            ),

            "industry": (
                company.industry
                if company
                else ""
            ),

            "location": (
                company.location
                if company
                else ""
            ),

            "website": (
                company.website
                if company
                else ""
            )
        },

        "title": job.title,

        "location": job.location,

        "description": job.description or "",

        "required_skills": job.required_skills or "",

        "salary": job.salary or "",

        "job_type": job.job_type or "Full-time",

        "application_deadline": job.application_deadline,

        "source_name": job.source_name or "",

        "source_url": job.source_url or "",

        "application_url": (
            job.application_url
            if getattr(job, "application_url", None)
            else job.source_url
        ),

        "published_date": job.published_date,

        "last_checked_at": job.last_checked_at,

        "status": job.status or "active",

        "created_at": job.created_at
    }


# ============================================================
# CREATE JOB - ADMIN
# ============================================================

@router.post("/")
def create_job(
    job_data: JobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    company = (
        db.query(Company)
        .filter(
            Company.id == job_data.company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found."
        )

    new_job = Job(

        company_id=job_data.company_id,

        title=job_data.title,

        location=job_data.location,

        description=job_data.description,

        required_skills=job_data.required_skills,

        salary=job_data.salary,

        job_type=job_data.job_type,

        application_deadline=(
            job_data.application_deadline
        ),

        source_name=job_data.source_name,

        source_url=job_data.source_url,

        application_url=(
            job_data.application_url
        ),

        published_date=(
            job_data.published_date
        ),

        last_checked_at=(
            job_data.last_checked_at
        ),

        status=job_data.status
    )

    db.add(new_job)

    db.commit()

    db.refresh(new_job)

    return {
        "message": "Job created successfully.",
        "job_id": new_job.id
    }


# ============================================================
# UPDATE JOB - ADMIN
# ============================================================

@router.put("/{job_id}")
def update_job(
    job_id: int,
    job_data: JobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    company = (
        db.query(Company)
        .filter(
            Company.id == job_data.company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found."
        )

    job.company_id = job_data.company_id
    job.title = job_data.title
    job.location = job_data.location
    job.description = job_data.description
    job.required_skills = job_data.required_skills
    job.salary = job_data.salary
    job.job_type = job_data.job_type
    job.application_deadline = job_data.application_deadline
    job.source_name = job_data.source_name
    job.source_url = job_data.source_url
    job.application_url = job_data.application_url
    job.published_date = job_data.published_date
    job.last_checked_at = job_data.last_checked_at
    job.status = job_data.status

    db.commit()

    db.refresh(job)

    return {
        "message": "Job updated successfully.",
        "job_id": job.id
    }


# ============================================================
# DELETE JOB - ADMIN
# ============================================================

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    db.delete(job)

    db.commit()

    return {
        "message": "Job deleted successfully."
    }