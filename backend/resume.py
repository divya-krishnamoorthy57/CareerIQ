from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pypdf import PdfReader
from io import BytesIO

from security import verify_access_token

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

security = HTTPBearer()


# Skills CareerIQ can currently detect
KNOWN_SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "React",
    "HTML",
    "CSS",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "FastAPI",
    "Django",
    "Flask",
    "Node.js",
    "Git",
    "GitHub",
    "Docker",
    "AWS",
    "Machine Learning",
    "Data Analysis",
    "Power BI",
    "Excel",
    "C++",
    "C",
]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return payload


@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume"
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported"
        )

    try:
        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        reader = PdfReader(
            BytesIO(file_content)
        )

        text_parts = []

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text_parts.append(page_text)

        resume_text = "\n".join(text_parts)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from this PDF"
            )

        resume_lower = resume_text.lower()

        detected_skills = []

        for skill in KNOWN_SKILLS:
            if skill.lower() in resume_lower:
                detected_skills.append(skill)

        score = calculate_resume_score(
            resume_text,
            detected_skills
        )

        strengths = []

        if detected_skills:
            strengths.append(
                "Technical skills are clearly present in the resume"
            )

        if "project" in resume_lower:
            strengths.append(
                "Project experience is included"
            )

        if "education" in resume_lower:
            strengths.append(
                "Education information is included"
            )

        if "experience" in resume_lower:
            strengths.append(
                "Professional experience is mentioned"
            )

        if not strengths:
            strengths.append(
                "Resume content was successfully extracted"
            )

        improvements = []

        if len(detected_skills) < 3:
            improvements.append(
                "Add more relevant technical skills"
            )

        if "project" not in resume_lower:
            improvements.append(
                "Add detailed project experience"
            )

        if "achievement" not in resume_lower:
            improvements.append(
                "Add measurable achievements"
            )

        if "certification" not in resume_lower:
            improvements.append(
                "Include relevant certifications"
            )

        return {
            "filename": file.filename,
            "score": score,
            "summary": get_summary(score),
            "detected_skills": detected_skills,
            "strengths": strengths,
            "improvements": improvements,
            "text_length": len(resume_text),
            "pages": len(reader.pages),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )


def calculate_resume_score(
    text: str,
    skills: list[str]
) -> int:

    score = 40

    if len(text) > 500:
        score += 10

    if len(text) > 1000:
        score += 10

    if len(skills) >= 3:
        score += 10

    if len(skills) >= 6:
        score += 10

    lower_text = text.lower()

    if "education" in lower_text:
        score += 5

    if "project" in lower_text:
        score += 5

    if "experience" in lower_text:
        score += 5

    if "certification" in lower_text:
        score += 5

    return min(score, 100)


def get_summary(score: int) -> str:

    if score >= 85:
        return (
            "Your resume has a strong foundation "
            "with good technical and career information."
        )

    if score >= 70:
        return (
            "Your resume has a good foundation. "
            "Adding stronger project details and "
            "measurable achievements can improve it."
        )

    if score >= 50:
        return (
            "Your resume contains useful information, "
            "but several areas can be strengthened."
        )

    return (
        "Your resume needs improvement in structure, "
        "skills and career-related information."
    )