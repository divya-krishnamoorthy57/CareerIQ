from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from models import User
from routers.auth import router as auth_router
from routers.profile import router as profile_router
from routers.companies import router as companies_router
from routers.jobs import router as jobs_router
from routers.applications import router as applications_router
from routers.dashboard import router as dashboard_router
from routers.career import router as career_router
from routers.resume import router as resume_router
from routers.interview import router as interview_router
from routers.career_advisor import router as career_advisor_router
from services.direct_job_url_service import resolve_direct_job_url
from scheduler import start_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)
start_scheduler()


app = FastAPI(title="CareerIQ API")


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(companies_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(dashboard_router)
app.include_router(career_router)
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(career_advisor_router)

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "app": "CareerIQ API",
        "status": "online"
    }


# =========================
# DATABASE TEST
# =========================

@app.get("/db-test")
def db_test():
    try:
        with engine.connect():
            return {
                "database": "connected",
                "status": "success"
            }

    except Exception as e:
        return {
            "database": "connection failed",
            "error": str(e)
        }
    
    @app.get("/test-direct-url")
    def test_direct_url(url: str):
     return resolve_direct_job_url(url)

    # =========================
# DIRECT JOB URL TEST
# =========================

@app.get("/test-direct-url")
def test_direct_url(url: str):
    return resolve_direct_job_url(url)