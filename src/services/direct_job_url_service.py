import requests
from urllib.parse import urlparse


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/154.0.0.0 Safari/537.36"
)


# Job listing / aggregator websites
AGGREGATOR_DOMAINS = {
    "adzuna.com",
    "adzuna.in",
    "adzuna.co.uk",
    "adzuna.com.au",
    "indeed.com",
    "linkedin.com",
    "glassdoor.com",
    "ziprecruiter.com",
    "simplyhired.com",
}


# Known Applicant Tracking Systems
DIRECT_ATS_DOMAINS = {
    "greenhouse.io",
    "boards.greenhouse.io",
    "lever.co",
    "jobs.lever.co",
    "workable.com",
    "apply.workable.com",
    "smartrecruiters.com",
    "jobs.smartrecruiters.com",
}


def get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().split(":")[0]
    except Exception:
        return ""


def is_aggregator(url: str) -> bool:
    domain = get_domain(url)

    if not domain:
        return True

    return any(
        domain == item or domain.endswith("." + item)
        for item in AGGREGATOR_DOMAINS
    )


def is_known_ats(url: str) -> bool:
    domain = get_domain(url)

    if not domain:
        return False

    return any(
        domain == item or domain.endswith("." + item)
        for item in DIRECT_ATS_DOMAINS
    )


def resolve_direct_job_url(source_url: str) -> dict:
    """
    Follow a job source URL and determine whether it reaches
    a direct company or known ATS application page.
    """

    if not source_url:
        return {
            "application_url": None,
            "is_direct": False,
            "final_url": "",
            "source": "No URL",
        }

    try:
        response = requests.get(
            source_url,
            headers={
                "User-Agent": USER_AGENT,
            },
            timeout=10,
            allow_redirects=True,
        )

        final_url = response.url

        if not final_url:
            return {
                "application_url": None,
                "is_direct": False,
                "final_url": "",
                "source": "No final URL",
            }

        # ------------------------------------------------
        # Aggregator / job listing website
        # ------------------------------------------------
        if is_aggregator(final_url):
            return {
                "application_url": None,
                "is_direct": False,
                "final_url": final_url,
                "source": "Aggregator",
            }

        # ------------------------------------------------
        # Known ATS platform
        # ------------------------------------------------
        if is_known_ats(final_url):
            return {
                "application_url": final_url,
                "is_direct": True,
                "final_url": final_url,
                "source": "ATS",
            }

        # ------------------------------------------------
        # Unknown external website
        #
        # Do NOT assume it is a direct application.
        # ------------------------------------------------
        return {
            "application_url": None,
            "is_direct": False,
            "final_url": final_url,
            "source": "Unverified External",
        }

    except requests.RequestException as exc:
        return {
            "application_url": None,
            "is_direct": False,
            "final_url": "",
            "source": f"Request failed: {str(exc)}",
        }

    except Exception as exc:
        return {
            "application_url": None,
            "is_direct": False,
            "final_url": "",
            "source": f"Error: {str(exc)}",
        }