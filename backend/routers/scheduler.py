from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal
from services.job_sync_service import sync_jobs_from_adzuna


def sync_jobs():

    db = SessionLocal()

    try:

        result = sync_jobs_from_adzuna(
            db=db,
            search_term="software developer",
            location="India",
            results_per_page=20
        )

        print("CareerIQ automatic job sync:")
        print(result)

    except Exception as e:

        print("CareerIQ job sync failed:")
        print(str(e))

    finally:

        db.close()


scheduler = BackgroundScheduler()

scheduler.add_job(
    sync_jobs,
    "interval",
    hours=6,
    id="adzuna_job_sync",
    replace_existing=True
)


def start_scheduler():

    scheduler.start()

    print("CareerIQ job scheduler started.")
    print("Next job sync will run automatically in 6 hours.")