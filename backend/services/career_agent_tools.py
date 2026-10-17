from sqlalchemy.orm import Session

from models import StudentProfile, Job, Company


def get_student_profile(
    db: Session,
    user_id: int
):
    profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()

    if not profile:
        return {
            "available": False,
            "message": "Student profile is not available."
        }

    return {
        "available": True,
        "name": profile.user_id,
        "skills": profile.skills or "",
        "career_goal": profile.career_goal or "",
        "preferred_job_role": profile.preferred_job_role or "",
        "college": profile.college or "",
        "degree": profile.degree or "",
        "department": profile.department or "",
        "graduation_year": profile.graduation_year,
        "cgpa": profile.cgpa or ""
    }


def get_active_jobs(
    db: Session
):
    jobs = db.query(Job).filter(
        Job.status == "active"
    ).all()

    results = []

    for job in jobs:

        company = db.query(Company).filter(
            Company.id == job.company_id
        ).first()

        results.append({
            "job_id": job.id,
            "title": job.title,
            "company": (
                company.name
                if company
                else "Unknown company"
            ),
            "location": job.location or "",
            "required_skills": (
                job.required_skills or ""
            ),
            "salary": job.salary or "",
            "job_type": job.job_type or "",
            "description": job.description or "",
            "deadline": (
                str(job.application_deadline)
                if job.application_deadline
                else None
            )
        })

    return {
        "available": True,
        "count": len(results),
        "jobs": results
    }


def calculate_job_match(
    db: Session,
    user_id: int,
    job_id: int
):
    profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not profile:
        return {
            "available": False,
            "message": "Student profile not found."
        }

    if not job:
        return {
            "available": False,
            "message": "Job not found."
        }

    student_skills = {
        skill.strip().lower()
        for skill in (profile.skills or "").split(",")
        if skill.strip()
    }

    required_skills = {
        skill.strip().lower()
        for skill in (job.required_skills or "").split(",")
        if skill.strip()
    }

    matched = sorted(
        student_skills.intersection(required_skills)
    )

    missing = sorted(
        required_skills.difference(student_skills)
    )

    total = len(required_skills)

    percentage = (
        round((len(matched) / total) * 100)
        if total
        else 0
    )

    return {
        "available": True,
        "job_id": job.id,
        "job_title": job.title,
        "match_percentage": percentage,
        "matched_skills": matched,
        "missing_skills": missing,
        "total_required_skills": total
    }


def get_skill_gap(
    db: Session,
    user_id: int,
    job_id: int
):
    match = calculate_job_match(
        db,
        user_id,
        job_id
    )

    if not match.get("available"):
        return match

    return {
        "available": True,
        "job_title": match["job_title"],
        "match_percentage": match["match_percentage"],
        "current_skills": match["matched_skills"],
        "missing_skills": match["missing_skills"]
    }


def get_career_context(
    db: Session,
    user_id: int
):
    profile = get_student_profile(
        db,
        user_id
    )

    jobs = get_active_jobs(db)

    return {
        "student_profile": profile,
        "active_jobs": jobs
    }