import json
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from groq import Groq

from database import get_db
from models import User
from security import verify_access_token

from services.career_agent_tools import (
    get_student_profile,
    get_active_jobs,
    calculate_job_match,
    get_skill_gap,
)


load_dotenv()


router = APIRouter(
    prefix="/career-advisor",
    tags=["AI Career Agent"]
)

security = HTTPBearer()


class AgentRequest(BaseModel):
    question: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    payload = verify_access_token(
        credentials.credentials
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token."
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return user


def get_groq_client():

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured."
        )

    return Groq(api_key=api_key)


def choose_tool(question: str):

    question_lower = question.lower()

    if any(
        word in question_lower
        for word in [
            "missing skill",
            "skill gap",
            "what skills am i missing",
            "skills am i missing"
        ]
    ):
        return "skill_gap"

    if any(
        word in question_lower
        for word in [
            "best match",
            "best job",
            "which job",
            "match",
            "matching",
            "eligible",
            "ready for",
            "fit for"
        ]
    ):
        return "job_match"

    if any(
        word in question_lower
        for word in [
            "job",
            "jobs",
            "opportunity",
            "opportunities",
            "apply"
        ]
    ):
        return "jobs"

    if any(
        word in question_lower
        for word in [
            "profile",
            "my skills",
            "my career",
            "career goal"
        ]
    ):
        return "profile"

    return "career_context"


def collect_agent_data(
    tool_name: str,
    user_id: int,
    db: Session
):

    # -----------------------------------
    # PROFILE TOOL
    # -----------------------------------

    if tool_name == "profile":

        profile = get_student_profile(
            db,
            user_id
        )

        return {
            "tool_used": "get_student_profile",
            "data": profile
        }

    # -----------------------------------
    # JOBS TOOL
    # -----------------------------------

    if tool_name == "jobs":

        jobs = get_active_jobs(db)

        return {
            "tool_used": "get_active_jobs",
            "data": jobs
        }

    # -----------------------------------
    # JOB MATCH TOOL
    # -----------------------------------

    if tool_name == "job_match":

        jobs = get_active_jobs(db)

        job_matches = []

        for job in jobs.get("jobs", []):

            match = calculate_job_match(
                db,
                user_id,
                job["job_id"]
            )

            job_matches.append(match)

        # Sort jobs from highest match
        # percentage to lowest.

        job_matches.sort(
            key=lambda item: item.get(
                "match_percentage",
                0
            ),
            reverse=True
        )

        return {
            "tool_used": (
                "get_active_jobs + "
                "calculate_job_match"
            ),
            "data": {
                "jobs": jobs,
                "job_matches": job_matches
            }
        }

    # -----------------------------------
    # SKILL GAP TOOL
    # -----------------------------------

    if tool_name == "skill_gap":

        jobs = get_active_jobs(db)

        skill_gaps = []

        for job in jobs.get("jobs", []):

            gap = get_skill_gap(
                db,
                user_id,
                job["job_id"]
            )

            skill_gaps.append(gap)

        return {
            "tool_used": (
                "get_active_jobs + "
                "get_skill_gap"
            ),
            "data": {
                "jobs": jobs,
                "skill_gaps": skill_gaps
            }
        }

    # -----------------------------------
    # GENERAL CAREER CONTEXT
    # -----------------------------------

    profile = get_student_profile(
        db,
        user_id
    )

    jobs = get_active_jobs(db)

    return {
        "tool_used": (
            "get_student_profile + "
            "get_active_jobs"
        ),
        "data": {
            "student_profile": profile,
            "active_jobs": jobs
        }
    }


@router.post("/ask")
async def ask_career_agent(
    request: AgentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # -----------------------------------
    # 1. SELECT AGENT TOOL
    # -----------------------------------

    selected_tool = choose_tool(
        question
    )

    # -----------------------------------
    # 2. EXECUTE ACTUAL TOOL
    # -----------------------------------

    agent_data = collect_agent_data(
        selected_tool,
        user.id,
        db
    )

    # -----------------------------------
    # 3. SEND REAL DATA TO GROQ
    # -----------------------------------

    client = get_groq_client()

    prompt = f"""
You are CareerIQ's AI Career Agent.

You are an intelligent career agent for MCA
students.

You MUST use the real CareerIQ data provided
below.

Do not invent information.

STUDENT QUESTION:

{question}


TOOL USED:

{agent_data["tool_used"]}


REAL CAREERIQ DATA:

{json.dumps(
    agent_data["data"],
    indent=2,
    default=str
)}


IMPORTANT RULES:

1. Use the provided database information.

2. Never invent jobs, companies, salaries,
   skills, deadlines or qualifications.

3. If job match percentages are provided,
   use those percentages.

4. Do not calculate a different percentage
   from the database result.

5. If multiple jobs are available, compare
   their actual match percentages.

6. Recommend the job with the highest
   calculated match when the student asks
   for the best job.

7. Clearly mention matched skills and
   missing skills when relevant.

8. If no jobs are available, clearly say
   that no active jobs are currently
   available.

9. Give practical advice suitable for an
   MCA student.

10. Do not claim that the student has a
    skill unless it exists in the provided
    student data.

11. Do not ask the student to provide
    information that is already available
    in the CareerIQ data.

12. If information is genuinely unavailable,
    clearly say that it is unavailable.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "answer": "Clear personalized answer",
    "recommendations": [
        "Recommendation 1",
        "Recommendation 2"
    ],
    "next_steps": [
        "Next step 1",
        "Next step 2"
    ]
}}
"""

    try:

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are CareerIQ's AI Career Agent. "
                        "You use real database information "
                        "and calculated career metrics. "
                        "Never invent data. "
                        "Return only valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=900
        )

        content = response.choices[0].message.content

        if not content:
            raise HTTPException(
                status_code=500,
                detail="AI returned an empty response."
            )

        content = content.strip()

        if content.startswith("```"):

            content = content.replace(
                "```json",
                ""
            )

            content = content.replace(
                "```",
                ""
            )

            content = content.strip()

        result = json.loads(content)

        return {
            "question": question,
            "tool_used": agent_data["tool_used"],
            "answer": result.get(
                "answer",
                "No answer available."
            ),
            "recommendations": result.get(
                "recommendations",
                []
            ),
            "next_steps": result.get(
                "next_steps",
                []
            )
        }

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned invalid JSON."
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Career Agent failed: {str(e)}"
        )