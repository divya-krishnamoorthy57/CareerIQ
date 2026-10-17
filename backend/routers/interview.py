import json
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq


load_dotenv()


router = APIRouter(
    prefix="/interview",
    tags=["AI Interview"]
)


class InterviewRequest(BaseModel):
    question: str
    answer: str
    category: str = "General"


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured."
        )

    return Groq(api_key=api_key)


@router.post("/evaluate")
async def evaluate_answer(
    request: InterviewRequest
):

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty."
        )

    client = get_groq_client()

    prompt = f"""
You are an expert technical interviewer for an MCA
college placement platform called CareerIQ.

Evaluate the student's interview answer carefully.

INTERVIEW CATEGORY:
{request.category}

INTERVIEW QUESTION:
{request.question}

STUDENT ANSWER:
{request.answer}

Evaluate the answer based on:

1. Relevance to the question
2. Technical correctness
3. Clarity
4. Completeness
5. Interview communication quality

Do NOT judge the answer only by its length.

For technical questions, check whether the concepts
mentioned by the student are actually correct.

For HR or career questions, check whether the answer
is relevant, clear and convincing.

Do not invent experience or achievements that the
student did not mention.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "score": 0,
    "title": "Short evaluation title",
    "feedback": "Detailed constructive feedback",
    "strengths": [
        "Strength 1",
        "Strength 2"
    ],
    "improvements": [
        "Improvement 1",
        "Improvement 2"
    ],
    "better_answer": "Example of a stronger interview answer"
}}

The score must be an integer between 0 and 100.

Keep feedback useful for a college student preparing
for technical placement interviews.
"""

    try:

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional technical "
                        "and placement interviewer. "
                        "Return only valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=800
        )

        content = response.choices[0].message.content

        if not content:
            raise HTTPException(
                status_code=500,
                detail="AI returned an empty response."
            )

        content = content.strip()

        # Remove markdown code fences if the model
        # accidentally returns them.
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

        score = int(result.get("score", 0))

        # Keep score safely between 0 and 100.
        score = max(0, min(score, 100))

        strengths = result.get(
            "strengths",
            []
        )

        improvements = result.get(
            "improvements",
            []
        )

        if not isinstance(strengths, list):
            strengths = [str(strengths)]

        if not isinstance(improvements, list):
            improvements = [str(improvements)]

        return {
            "score": score,

            "title": result.get(
                "title",
                "Answer evaluated"
            ),

            "feedback": result.get(
                "feedback",
                "No feedback available."
            ),

            "strengths": strengths,

            "improvements": improvements,

            "better_answer": result.get(
                "better_answer",
                ""
            ),

            "word_count": len(
                request.answer.split()
            ),

            "question": request.question,

            "category": request.category
        }

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid JSON response."
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"AI interview evaluation failed: {str(e)}"
            )
        )