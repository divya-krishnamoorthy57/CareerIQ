
import os
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
from sqlalchemy.orm import Session

from models import Job, Company
from services.direct_job_url_service import resolve_direct_job_url


# ============================================================
# ADZUNA CONFIGURATION
# ============================================================

def get_adzuna_credentials():
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise RuntimeError(
            "Adzuna API credentials are missing. "
            "Set ADZUNA_APP_ID and ADZUNA_APP_KEY."
        )

    return app_id, app_key


# ============================================================
# SKILL EXTRACTION
# ============================================================

SKILL_LIST = [
    "Python", "Java", "JavaScript", "TypeScript",
    "React", "React.js", "Node.js", "Express",
    "Angular", "Vue", "HTML", "CSS", "Tailwind",
    "Bootstrap", "SQL", "MySQL", "PostgreSQL",
    "MongoDB", "Oracle", "Git", "GitHub", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "FastAPI",
    "Django", "Flask", "Spring Boot", "C++", "C#",
    ".NET", "PHP", "Laravel", "Machine Learning",
    "Deep Learning", "Artificial Intelligence", "AI",
    "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Power BI", "Tableau", "Data Analysis",
    "Data Science", "REST API", "API", "Linux", "DevOps",
]


def extract_required_skills(text: str) -> str:
    if not text:
        return ""

    found = []

    for skill in SKILL_LIST:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            found.append(skill)

    return ", ".join(found)


# ============================================================
# FIELD NORMALIZATION
# ============================================================

def extract_location(job_data: dict) -> str:
    location_data = job_data.get("location") or {}

    if isinstance(location_data, dict):
        display_name = location_data.get("display_name")

        if display_name:
            return str(display_name).strip()[:150]

        area = location_data.get("area")

        if isinstance(area, list) and area:
            return ", ".join(str(item) for item in area)[:150]

    if isinstance(location_data, str) and location_data.strip():
        return location_data.strip()[:150]

    return "India"


def extract_salary(job_data: dict) -> str:
    salary_min = job_data.get("salary_min")
    salary_max = job_data.get("salary_max")

    if salary_min is not None and salary_max is not None:
        return f"{salary_min} - {salary_max}"[:100]

    if salary_min is not None:
        return f"From {salary_min}"[:100]

    if salary_max is not None:
        return f"Up to {salary_max}"[:100]

    return ""


def extract_job_type(title: str, description: str) -> str:
    text = f"{title} {description}".lower()

    if "internship" in text or re.search(r"\bintern\b", text):
        return "Internship"

    if "part-time" in text or "part time" in text:
        return "Part-time"

    if "contract" in text:
        return "Contract"

    if "temporary" in text:
        return "Temporary"

    return "Full-time"


def extract_published_date(job_data: dict):
    created_value = job_data.get("created")

    if not created_value:
        return None

    try:
        parsed_date = datetime.fromisoformat(
            str(created_value).replace("Z", "+00:00")
        )

        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)

        return parsed_date

    except (ValueError, TypeError, AttributeError):
        return None


# ============================================================
# SOURCE URL HANDLING
# ============================================================

def _usable_source_url(job_data: dict) -> str:
    """
    Return a valid HTTP(S) source URL.

    Adzuna's adref may be a tracking token rather than a URL,
    so it is deliberately not treated as an application link.
    """
    for key in ("redirect_url", "url"):
        candidate = job_data.get(key) or ""

        if not isinstance(candidate, str):
            continue

        candidate = candidate.strip()

        if not candidate:
            continue

        try:
            parsed = urlparse(candidate)

            if (
                parsed.scheme.lower() in {"http", "https"}
                and parsed.hostname
            ):
                return candidate[:500]

        except (TypeError, ValueError):
            continue

    return ""


def get_verified_application_url(source_url: str):
    """Return a candidate direct link when the resolver accepts it."""
    if not source_url:
        return None

    try:
        result = resolve_direct_job_url(source_url)

        if not isinstance(result, dict):
            return None

        candidate = result.get("application_url")

        if (
            result.get("is_direct")
            and isinstance(candidate, str)
            and candidate.startswith(("https://", "http://"))
        ):
            parsed = urlparse(candidate)

            if parsed.hostname:
                return candidate[:1000]

    except Exception as exc:
        print(
            "Application URL resolution failed: "
            f"{type(exc).__name__}: {exc}"
        )

    return None


# ============================================================
# PROCESS ONE JOB
# ============================================================

def process_job(db: Session, job_data: dict, seen_urls: set):
    source_url = _usable_source_url(job_data)

    title = str(
        job_data.get("title") or "Untitled Job"
    ).strip()[:200]

    # Avoid duplicates across overlapping search terms in one sync.
    if source_url and source_url in seen_urls:
        return "skipped"

    if source_url:
        seen_urls.add(source_url)

    company_data = job_data.get("company") or {}

    if isinstance(company_data, dict):
        company_name = str(
            company_data.get("display_name") or "Unknown Company"
        ).strip()[:150]
    else:
        company_name = str(company_data).strip()[:150]
        company_name = company_name or "Unknown Company"

    location = extract_location(job_data)

    company = (
        db.query(Company)
        .filter(Company.name == company_name)
        .first()
    )

    if not company:
        company = Company(
            name=company_name,
            industry="",
            location=location,
            website="",
        )
        db.add(company)
        db.flush()

    description = str(job_data.get("description") or "")[:2000]

    required_skills = extract_required_skills(
        f"{title} {description}"
    )[:1000]

    salary = extract_salary(job_data)
    published_date = extract_published_date(job_data)
    job_type = extract_job_type(title, description)

    existing_job = None

    if source_url:
        existing_job = (
            db.query(Job)
            .filter(Job.source_url == source_url)
            .first()
        )

    # If URL resolution fails, retain an existing direct application URL.
    resolved_url = (
        get_verified_application_url(source_url)
        if source_url
        else None
    )

    if existing_job:
        existing_job.company_id = company.id
        existing_job.title = title
        existing_job.location = location
        existing_job.description = description
        existing_job.required_skills = required_skills
        existing_job.salary = salary
        existing_job.job_type = job_type
        existing_job.published_date = published_date
        existing_job.source_name = "Adzuna"
        existing_job.status = "active"
        existing_job.last_checked_at = datetime.now(timezone.utc)

        if resolved_url:
            existing_job.application_url = resolved_url

        return "updated"

    new_job = Job(
        company_id=company.id,
        title=title,
        location=location,
        description=description,
        required_skills=required_skills,
        salary=salary,
        job_type=job_type,
        published_date=published_date,
        source_name="Adzuna",
        source_url=source_url or None,
        application_url=resolved_url,
        status="active",
        last_checked_at=datetime.now(timezone.utc),
    )

    db.add(new_job)

    return "imported"


# ============================================================
# SYNCHRONIZE JOBS FROM ADZUNA
# ============================================================

def sync_jobs_from_adzuna(
    db: Session,
    search_term: str = "software developer",
    location: str = "India",
    results_per_page: int = 20,
    max_pages: int = 5,
):
    app_id, app_key = get_adzuna_credentials()

    search_terms = [
        "software developer",
        "software engineer",
        "full stack developer",
        "frontend developer",
        "backend developer",
        "web developer",
        "react developer",
        "python developer",
        "java developer",
        "data analyst",
        "data scientist",
        "machine learning engineer",
        "AI engineer",
        "DevOps engineer",
        "cloud engineer",
    ]

    if (
        search_term
        and search_term.strip()
        and search_term.strip().lower()
        not in {term.lower() for term in search_terms}
    ):
        search_terms.insert(0, search_term.strip())

    imported = 0
    updated = 0
    skipped = 0
    failed = 0

    total_results = 0
    pages_fetched = 0
    unique_results_processed = 0

    seen_urls = set()

    page_size = max(1, min(int(results_per_page), 50))
    page_limit = max(1, int(max_pages))

    session = requests.Session()

    try:
        for term in search_terms:
            print(f"\nSearching Adzuna for: {term}")

            for page in range(1, page_limit + 1):
                endpoint = (
                    "https://api.adzuna.com/v1/api/jobs/in/search/"
                    f"{page}"
                )

                params = {
                    "app_id": app_id,
                    "app_key": app_key,
                    "results_per_page": page_size,
                    "what": term,
                    "where": location,
                    "content-type": "application/json",
                }

                try:
                    response = session.get(
                        endpoint,
                        params=params,
                        timeout=(5, 25),
                    )
                    response.raise_for_status()
                    data = response.json()

                except requests.RequestException as exc:
                    print(
                        f"Adzuna request failed for '{term}', "
                        f"page {page}: {exc}"
                    )
                    break

                except ValueError as exc:
                    print(
                        f"Invalid Adzuna response for '{term}', "
                        f"page {page}: {exc}"
                    )
                    break

                results = (
                    data.get("results", [])
                    if isinstance(data, dict)
                    else []
                )

                if not results:
                    print(f"No results for '{term}', page {page}")
                    break

                pages_fetched += 1
                total_results += len(results)

                print(
                    f"{term} | page {page} | "
                    f"{len(results)} results"
                )

                for job_data in results:
                    if not isinstance(job_data, dict):
                        failed += 1
                        continue

                    try:
                        result = process_job(
                            db,
                            job_data,
                            seen_urls,
                        )

                        if result == "skipped":
                            skipped += 1
                            continue

                        # Commit each successful job independently so
                        # a later failure cannot undo earlier imports.
                        db.commit()

                        if result == "imported":
                            imported += 1
                        elif result == "updated":
                            updated += 1

                        unique_results_processed += 1

                    except Exception as exc:
                        db.rollback()
                        failed += 1

                        print(
                            "Failed to process job "
                            f"'{job_data.get('title', 'Unknown')}': "
                            f"{type(exc).__name__}: {exc}"
                        )

    finally:
        session.close()

    summary = {
        "message": "Job synchronization completed.",
        "searches_used": len(search_terms),
        "search_terms": search_terms,
        "pages_fetched": pages_fetched,
        "results_per_page": page_size,
        "total_results": total_results,
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "failed": failed,
        "unique_results_processed": unique_results_processed,
    }

    print("\n======================================")
    print("ADZUNA SYNC COMPLETED")

    for key, value in summary.items():
        print(f"{key}: {value}")

    print("======================================")

    return summary
