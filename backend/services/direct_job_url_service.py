
"""Resolve job links to employer or applicant-tracking-system pages."""

from functools import lru_cache
from urllib.parse import urlparse

import requests

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

AGGREGATOR_DOMAINS = {
    "adzuna.com",
    "adzuna.in",
    "adzuna.co.uk",
    "adzuna.com.au",
    "indeed.com",
    "indeed.co.in",
    "linkedin.com",
    "glassdoor.com",
    "ziprecruiter.com",
    "simplyhired.com",
    "monster.com",
    "foundit.in",
    "naukri.com",
    "shine.com",
    "timesjobs.com",
    "jooble.org",
    "careerjet.com",
    "talent.com",
    "bebee.com",
    "whatjobs.com",
}

DIRECT_ATS_DOMAINS = {
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "smartrecruiters.com",
    "ashbyhq.com",
    "myworkdayjobs.com",
    "icims.com",
    "jobvite.com",
    "successfactors.com",
    "oraclecloud.com",
    "recruitee.com",
    "breezy.hr",
    "teamtailor.com",
    "applytojob.com",
    "pinpointhq.com",
}

JOB_PATH_MARKERS = (
    "/job/",
    "/jobs/",
    "/career/",
    "/careers/",
    "/apply/",
    "/application/",
    "/vacancy/",
    "/vacancies/",
    "/position/",
    "/positions/",
    "/requisition/",
    "/job-details/",
    "/jobdetails/",
)


def get_domain(url: str) -> str:
    """Return the normalized hostname from a URL."""
    try:
        return (urlparse(url).hostname or "").lower().rstrip(".")
    except (TypeError, ValueError):
        return ""


def _matches_domain(url: str, domains: set[str]) -> bool:
    domain = get_domain(url)

    return bool(domain) and any(
        domain == item or domain.endswith("." + item)
        for item in domains
    )


def is_aggregator(url: str) -> bool:
    """Identify known job-board and aggregator domains."""
    return not get_domain(url) or _matches_domain(
        url, AGGREGATOR_DOMAINS
    )


def is_known_ats(url: str) -> bool:
    """Identify supported applicant-tracking-system domains."""
    return _matches_domain(url, DIRECT_ATS_DOMAINS)


def _valid_http_url(url: str) -> bool:
    """Reject missing URLs and non-HTTP destinations."""
    try:
        parsed = urlparse(url)

        return (
            parsed.scheme.lower() in {"http", "https"}
            and bool(parsed.hostname)
        )
    except (TypeError, ValueError):
        return False


def _looks_like_job_page(url: str) -> bool:
    """Check whether an employer URL resembles a specific job page."""
    try:
        parsed = urlparse(url)
        path = (parsed.path or "").lower()
        query = (parsed.query or "").lower()

        return (
            any(marker in path for marker in JOB_PATH_MARKERS)
            or any(
                marker in query
                for marker in (
                    "jobid=",
                    "job_id=",
                    "gh_jid=",
                    "lever-source=",
                )
            )
        )
    except (TypeError, ValueError):
        return False


def _result(
    application_url=None,
    is_direct=False,
    final_url="",
    source="",
):
    return {
        "application_url": application_url,
        "is_direct": bool(is_direct),
        "final_url": final_url or "",
        "source": source,
    }


@lru_cache(maxsize=2048)
def _resolve_cached(source_url: str) -> tuple:
    """Resolve a URL while caching repeated lookups."""
    if not source_url or not _valid_http_url(source_url):
        return (
            None,
            False,
            "",
            "Invalid or missing URL",
        )

    try:
        response = requests.get(
            source_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,*/*;q=0.8",
            },
            timeout=(3.05, 5),
            allow_redirects=True,
            stream=True,
        )

        try:
            final_url = response.url or source_url
            status_code = response.status_code
        finally:
            response.close()

        if not _valid_http_url(final_url):
            return (
                None,
                False,
                "",
                "Invalid redirect destination",
            )

        if is_aggregator(final_url):
            return (
                None,
                False,
                final_url,
                "Job aggregator",
            )

        if is_known_ats(final_url):
            return (
                final_url,
                True,
                final_url,
                "Known ATS",
            )

        # Employer-hosted career pages can use company-owned domains.
        # Accept job-specific URLs, not generic company homepages.
        if _looks_like_job_page(final_url):
            return (
                final_url,
                True,
                final_url,
                f"Employer job page (HTTP {status_code})",
            )

        return (
            None,
            False,
            final_url,
            "External page not verified as a job page",
        )

    except requests.RequestException as exc:
        return (
            None,
            False,
            "",
            f"Redirect lookup failed: {type(exc).__name__}",
        )
    except Exception as exc:
        # One malformed link must not stop the complete job sync.
        return (
            None,
            False,
            "",
            f"Resolver error: {type(exc).__name__}",
        )


def resolve_direct_job_url(source_url: str) -> dict:
    """
    Return a candidate direct job URL.

    This checks the destination type, not whether the vacancy
    is still open or whether the application form is functional.
    """
    source_url = (source_url or "").strip()

    if not source_url:
        return _result(source="No URL")

    application_url, is_direct, final_url, source = (
        _resolve_cached(source_url)
    )

    return _result(
        application_url=application_url,
        is_direct=is_direct,
        final_url=final_url,
        source=source,
    )


def clear_url_resolution_cache() -> None:
    """Clear cached URL checks when testing or updating link logic."""
    _resolve_cached.cache_clear()
