from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pypdf import PdfReader
from io import BytesIO
import re

from security import verify_access_token


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

security = HTTPBearer()


# =========================================================
# KNOWN SKILLS
# =========================================================

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
    "Angular",
    "Vue.js",
    "Next.js",
    "Express.js",
    "Spring Boot",
    "REST API",
    "REST APIs",
    "API",
    "Firebase",
    "Azure",
    "GCP",
    "Linux",
    "Figma",
    "Tailwind CSS",
    "Bootstrap",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "NLP",
    "Artificial Intelligence",
    "Generative AI",
    "LangChain",
    "FAISS",
]


# =========================================================
# ROLE-SPECIFIC KEYWORDS
# =========================================================

ROLE_KEYWORDS = {

    "software developer": [
        "python",
        "java",
        "javascript",
        "typescript",
        "react",
        "sql",
        "git",
        "github",
        "api",
        "software development",
        "problem solving",
        "debugging",
        "testing",
    ],

    "software engineer": [
        "python",
        "java",
        "javascript",
        "typescript",
        "sql",
        "git",
        "github",
        "api",
        "software development",
        "testing",
        "debugging",
        "problem solving",
        "data structures",
    ],

    "frontend developer": [
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue",
        "next.js",
        "responsive design",
        "git",
        "github",
        "api",
        "ui",
        "ux",
    ],

    "backend developer": [
        "python",
        "java",
        "node.js",
        "fastapi",
        "django",
        "flask",
        "spring boot",
        "sql",
        "mysql",
        "postgresql",
        "mongodb",
        "api",
        "rest api",
        "git",
        "github",
    ],

    "full stack developer": [
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "node.js",
        "python",
        "fastapi",
        "sql",
        "mysql",
        "mongodb",
        "api",
        "rest api",
        "git",
        "github",
    ],

    "python developer": [
        "python",
        "fastapi",
        "django",
        "flask",
        "sql",
        "mysql",
        "postgresql",
        "git",
        "github",
        "api",
        "rest api",
    ],

    "java developer": [
        "java",
        "spring boot",
        "spring",
        "sql",
        "mysql",
        "postgresql",
        "hibernate",
        "rest api",
        "git",
        "github",
    ],

    "data analyst": [
        "python",
        "sql",
        "excel",
        "power bi",
        "tableau",
        "data analysis",
        "pandas",
        "numpy",
        "statistics",
        "data visualization",
    ],

    "data scientist": [
        "python",
        "sql",
        "machine learning",
        "data science",
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "statistics",
        "data analysis",
    ],

    "ai engineer": [
        "python",
        "machine learning",
        "artificial intelligence",
        "deep learning",
        "tensorflow",
        "pytorch",
        "nlp",
        "generative ai",
        "langchain",
        "sql",
    ],

    "ai/ml engineer": [
        "python",
        "machine learning",
        "artificial intelligence",
        "deep learning",
        "tensorflow",
        "pytorch",
        "nlp",
        "generative ai",
        "langchain",
        "scikit-learn",
    ],

    "machine learning engineer": [
        "python",
        "machine learning",
        "deep learning",
        "tensorflow",
        "pytorch",
        "scikit-learn",
        "pandas",
        "numpy",
        "nlp",
        "data science",
    ],
}


# =========================================================
# AUTHENTICATION
# =========================================================

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


# =========================================================
# RESUME ANALYSIS
# =========================================================

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form(""),
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

        # =================================================
        # READ PDF
        # =================================================

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

        # =================================================
        # TARGET ROLE
        # =================================================

        role = target_role.strip()

        if not role:
            role = "Software Developer"

        # =================================================
        # DETECT SKILLS
        # =================================================

        detected_skills = []

        for skill in KNOWN_SKILLS:

            pattern = (
                r"(?<!\w)"
                + re.escape(skill.lower())
                + r"(?!\w)"
            )

            if re.search(pattern, resume_lower):
                detected_skills.append(skill)

        # =================================================
        # ROLE KEYWORDS
        # =================================================

        role_keywords = get_role_keywords(role)

        (
            keyword_score,
            matched_keywords,
            missing_keywords
        ) = calculate_keyword_score(
            resume_lower,
            role_keywords
        )

        # =================================================
        # CATEGORY SCORES
        # =================================================

        ats_score = calculate_ats_score(
            resume_text,
            reader,
            detected_skills
        )

        content_score = calculate_content_score(
            resume_lower
        )

        readability_score = calculate_readability_score(
            resume_text
        )

        overall_score = calculate_overall_score(
            ats_score,
            keyword_score,
            content_score,
            readability_score
        )

        # =================================================
        # CATEGORY STATUS
        # =================================================

        ats_status = get_score_status(
            ats_score,
            "ATS"
        )

        keyword_status = get_score_status(
            keyword_score,
            "Keywords"
        )

        content_status = get_score_status(
            content_score,
            "Content"
        )

        readability_status = get_score_status(
            readability_score,
            "Readability"
        )

        # =================================================
        # CATEGORY MESSAGES
        # =================================================

        ats_message = get_ats_message(
            ats_score
        )

        keyword_message = get_keyword_message(
            keyword_score,
            role,
            missing_keywords
        )

        content_message = get_content_message(
            content_score
        )

        readability_message = get_readability_message(
            readability_score
        )

        # =================================================
        # ATS FRIENDLY
        # =================================================

        ats_friendly = ats_score >= 70

        # =================================================
        # CHANGES REQUIRED
        # =================================================

        changes_required = 0

        if ats_score < 70:
            changes_required += 1

        if keyword_score < 70:
            changes_required += 1

        if content_score < 70:
            changes_required += 1

        if readability_score < 70:
            changes_required += 1

        # =================================================
        # STRENGTHS
        # =================================================

        strengths = []

        if detected_skills:
            strengths.append(
                "Technical skills are clearly present in the resume."
            )

        if "project" in resume_lower:
            strengths.append(
                "Project experience is included."
            )

        if "education" in resume_lower:
            strengths.append(
                "Education information is included."
            )

        if "experience" in resume_lower:
            strengths.append(
                "Professional experience is mentioned."
            )

        if ats_score >= 85:
            strengths.append(
                "The resume has a strong ATS-friendly structure."
            )

        elif ats_score >= 70:
            strengths.append(
                "The resume has an acceptable ATS-friendly structure."
            )

        if keyword_score >= 85:
            strengths.append(
                f"Strong keyword alignment with the {role} role."
            )

        elif keyword_score >= 70:
            strengths.append(
                f"Good keyword alignment with the {role} role."
            )

        if content_score >= 85:
            strengths.append(
                "Resume content is complete and well presented."
            )

        elif content_score >= 70:
            strengths.append(
                "The resume contains the major career sections."
            )

        if not strengths:
            strengths.append(
                "Resume content was successfully extracted."
            )

        # =================================================
        # ACTIONABLE IMPROVEMENTS
        # =================================================

        improvements = []

        # -------------------------------------------------
        # KEYWORDS
        # -------------------------------------------------

        if keyword_score < 70:

            if missing_keywords:

                missing_text = ", ".join(
                    missing_keywords[:5]
                )

                improvements.append(
                    f"Add relevant {role} keywords such as "
                    f"{missing_text} to improve job alignment."
                )

            else:

                improvements.append(
                    f"Add more skills and keywords related to "
                    f"the {role} role."
                )

        elif keyword_score < 85:

            if missing_keywords:

                missing_text = ", ".join(
                    missing_keywords[:3]
                )

                improvements.append(
                    f"Your {role} keyword alignment is good. "
                    f"For further improvement, consider adding: "
                    f"{missing_text}."
                )

        # -------------------------------------------------
        # ATS
        # -------------------------------------------------

        if ats_score < 70:

            improvements.append(
                "Improve ATS compatibility by using standard section "
                "headings, readable formatting, complete contact "
                "information and simple resume structure."
            )

        elif ats_score < 85:

            improvements.append(
                "ATS compatibility is good. Keep the formatting simple "
                "and avoid unnecessary graphics or complex layouts."
            )

        # -------------------------------------------------
        # CONTENT
        # -------------------------------------------------

        if content_score < 70:

            improvements.append(
                "Strengthen your resume content by adding detailed "
                "projects, experience, skills, certifications and achievements."
            )

        elif content_score < 85:

            improvements.append(
                "Your resume content is good. Add stronger project "
                "descriptions and specific results to make it more impactful."
            )

        # -------------------------------------------------
        # READABILITY
        # -------------------------------------------------

        if readability_score < 70:

            improvements.append(
                "Improve readability by using shorter bullet points, "
                "clear headings and concise descriptions."
            )

        elif readability_score < 85:

            improvements.append(
                "Readability is good. Keep bullet points concise and "
                "avoid unnecessarily long sentences."
            )

        # =================================================
        # MEASURABLE ACHIEVEMENTS
        # =================================================

        measurable_numbers = re.findall(
            r"\b\d+(?:\.\d+)?%?\b",
            resume_text
        )

        has_achievement_section = (
            "achievement" in resume_lower
            or "achievements" in resume_lower
        )

        if (
            not has_achievement_section
            and len(measurable_numbers) < 4
        ):

            if "project" in resume_lower:

                improvements.append(
                    "Consider adding measurable results to your projects, "
                    "such as the number of features or modules developed, "
                    "APIs created, users tested, technologies used, "
                    "accuracy achieved or performance improvements."
                )

            elif "experience" in resume_lower:

                improvements.append(
                    "Consider adding measurable results to your experience, "
                    "such as users handled, tasks completed, time saved, "
                    "performance improvements or percentage-based results."
                )

            else:

                improvements.append(
                    "Consider adding measurable achievements using numbers, "
                    "percentages, project counts, users, features, accuracy "
                    "or performance results."
                )

        # =================================================
        # CERTIFICATIONS
        # =================================================

        if (
            "certification" not in resume_lower
            and "certifications" not in resume_lower
        ):

            improvements.append(
                "If you have relevant certifications, add them to your "
                "resume under a dedicated Certifications section."
            )

        # =================================================
        # REMOVE DUPLICATES
        # =================================================

        improvements = list(
            dict.fromkeys(improvements)
        )

        # =================================================
        # SUMMARY
        # =================================================

        summary = get_summary(
            overall_score,
            role
        )

        # =================================================
        # RETURN
        # =================================================

        return {

            "filename": file.filename,

            "score": overall_score,

            "ats_score": ats_score,
            "ats_status": ats_status,
            "ats_message": ats_message,

            "keyword_score": keyword_score,
            "keyword_status": keyword_status,
            "keyword_message": keyword_message,

            "content_score": content_score,
            "content_status": content_status,
            "content_message": content_message,

            "readability_score": readability_score,
            "readability_status": readability_status,
            "readability_message": readability_message,

            "ats_friendly": ats_friendly,

            "changes_required": changes_required,

            "target_role": role,

            "summary": summary,

            "detected_skills": detected_skills,

            "matched_keywords": matched_keywords,

            "missing_keywords": missing_keywords,

            "strengths": strengths,

            "improvements": improvements,

            "text_length": len(resume_text),

            "pages": len(reader.pages)
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )


# =========================================================
# ROLE KEYWORDS
# =========================================================

def get_role_keywords(
    role: str
) -> list[str]:

    role_lower = role.lower().strip()

    if role_lower in ROLE_KEYWORDS:
        return ROLE_KEYWORDS[role_lower]

    for known_role, keywords in ROLE_KEYWORDS.items():

        if known_role in role_lower:
            return keywords

        if role_lower in known_role:
            return keywords

    return [
        "python",
        "java",
        "javascript",
        "typescript",
        "sql",
        "git",
        "github",
        "api",
        "project",
        "problem solving",
    ]


# =========================================================
# KEYWORD SCORE
# =========================================================

def calculate_keyword_score(
    resume_text: str,
    role_keywords: list[str]
):

    if not role_keywords:
        return 0, [], []

    matched_keywords = []
    missing_keywords = []

    for keyword in role_keywords:

        if keyword.lower() in resume_text:

            matched_keywords.append(
                keyword
            )

        else:

            missing_keywords.append(
                keyword
            )

    score = (
        len(matched_keywords)
        / len(role_keywords)
    ) * 100

    return (
        min(round(score), 100),
        matched_keywords,
        missing_keywords
    )


# =========================================================
# ATS SCORE
# =========================================================

def calculate_ats_score(
    text: str,
    reader,
    skills: list[str]
) -> int:

    lower_text = text.lower()

    score = 0

    # Text length
    if len(text.strip()) >= 500:
        score += 15

    elif len(text.strip()) >= 250:
        score += 10

    # Email
    if re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    ):
        score += 15

    # Phone
    if re.search(
        r"\b(?:\+91[-\s]?)?[6-9]\d{9}\b",
        text
    ):
        score += 10

    # Sections
    sections = [
        "education",
        "experience",
        "skills",
        "projects",
        "summary",
        "objective",
        "certifications",
    ]

    section_count = sum(
        1
        for section in sections
        if section in lower_text
    )

    if section_count >= 5:
        score += 25

    elif section_count >= 4:
        score += 20

    elif section_count >= 3:
        score += 15

    elif section_count >= 2:
        score += 10

    # Skills
    if len(skills) >= 8:
        score += 15

    elif len(skills) >= 5:
        score += 12

    elif len(skills) >= 3:
        score += 8

    elif len(skills) >= 1:
        score += 5

    # Pages
    page_count = len(reader.pages)

    if 1 <= page_count <= 2:
        score += 10

    elif page_count == 3:
        score += 5

    # Bullet points
    bullet_count = len(
        re.findall(
            r"(?:^|\n)\s*[•●▪◦\-*]",
            text
        )
    )

    if bullet_count >= 8:
        score += 10

    elif bullet_count >= 4:
        score += 7

    elif bullet_count >= 1:
        score += 4

    return min(score, 100)


# =========================================================
# CONTENT SCORE
# =========================================================

def calculate_content_score(
    text: str
) -> int:

    score = 0

    sections = {
        "summary": [
            "summary",
            "profile",
            "professional summary",
            "career objective",
            "objective",
        ],

        "education": [
            "education",
            "academic",
        ],

        "experience": [
            "experience",
            "work experience",
            "internship",
            "employment",
        ],

        "projects": [
            "project",
            "projects",
        ],

        "skills": [
            "skills",
            "technical skills",
            "technologies",
        ],

        "certifications": [
            "certification",
            "certifications",
        ],
    }

    section_points = 0

    for values in sections.values():

        if any(
            value in text
            for value in values
        ):
            section_points += 10

    score += min(
        section_points,
        60
    )

    action_words = [
        "developed",
        "built",
        "created",
        "implemented",
        "designed",
        "develop",
        "managed",
        "improved",
        "optimized",
        "analyzed",
        "tested",
        "deployed",
        "integrated",
        "automated",
    ]

    action_count = sum(
        1
        for word in action_words
        if word in text
    )

    if action_count >= 6:
        score += 20

    elif action_count >= 4:
        score += 15

    elif action_count >= 2:
        score += 10

    elif action_count >= 1:
        score += 5

    number_count = len(
        re.findall(
            r"\b\d+(?:\.\d+)?%?\b",
            text
        )
    )

    if number_count >= 8:
        score += 20

    elif number_count >= 5:
        score += 15

    elif number_count >= 2:
        score += 10

    elif number_count >= 1:
        score += 5

    return min(
        score,
        100
    )


# =========================================================
# READABILITY SCORE
# =========================================================

def calculate_readability_score(
    text: str
) -> int:

    clean_text = text.strip()

    if not clean_text:
        return 0

    words = re.findall(
        r"\b[\w+#.-]+\b",
        clean_text
    )

    word_count = len(words)

    if word_count == 0:
        return 0

    sentences = re.split(
        r"[.!?]+",
        clean_text
    )

    sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    sentence_count = max(
        len(sentences),
        1
    )

    average_words_per_sentence = (
        word_count / sentence_count
    )

    score = 100

    if word_count < 150:
        score -= 25

    elif word_count < 250:
        score -= 15

    if average_words_per_sentence > 35:
        score -= 20

    elif average_words_per_sentence > 28:
        score -= 10

    repeated_spaces = len(
        re.findall(
            r"[ \t]{4,}",
            text
        )
    )

    if repeated_spaces > 10:
        score -= 10

    lines = clean_text.splitlines()

    long_lines = sum(
        1
        for line in lines
        if len(line.strip()) > 180
    )

    if long_lines >= 5:
        score -= 15

    elif long_lines >= 2:
        score -= 8

    return max(
        0,
        min(score, 100)
    )


# =========================================================
# OVERALL SCORE
# =========================================================

def calculate_overall_score(
    ats_score: int,
    keyword_score: int,
    content_score: int,
    readability_score: int
) -> int:

    score = (
        ats_score * 0.30
        + keyword_score * 0.35
        + content_score * 0.20
        + readability_score * 0.15
    )

    return round(
        max(
            0,
            min(score, 100)
        )
    )


# =========================================================
# STATUS
# =========================================================

def get_score_status(
    score: int,
    category: str
) -> str:

    if score >= 85:
        return "Satisfied"

    if score >= 70:
        return "Good"

    return "Needs Improvement"


# =========================================================
# ATS MESSAGE
# =========================================================

def get_ats_message(
    score: int
) -> str:

    if score >= 85:

        return (
            "ATS requirement satisfied. Your resume has a clear "
            "structure, readable text and important resume sections."
        )

    if score >= 70:

        return (
            "ATS compatibility is good. Your resume meets the "
            "basic ATS requirements, with some room for improvement."
        )

    return (
        "ATS compatibility needs improvement. Use standard headings, "
        "simple formatting, complete contact information and readable text."
    )


# =========================================================
# KEYWORD MESSAGE
# =========================================================

def get_keyword_message(
    score: int,
    role: str,
    missing_keywords: list[str]
) -> str:

    if score >= 85:

        return (
            f"Strong keyword alignment. Your resume is well matched "
            f"to the {role} role."
        )

    if score >= 70:

        if missing_keywords:

            missing = ", ".join(
                missing_keywords[:3]
            )

            return (
                f"Good alignment with the {role} role. "
                f"Optional keywords to consider: {missing}."
            )

        return (
            f"Good keyword alignment with the {role} role."
        )

    if missing_keywords:

        missing = ", ".join(
            missing_keywords[:5]
        )

        return (
            f"Keyword alignment needs improvement for the {role} role. "
            f"Consider adding: {missing}."
        )

    return (
        f"Add more job-specific keywords for the {role} role."
    )


# =========================================================
# CONTENT MESSAGE
# =========================================================

def get_content_message(
    score: int
) -> str:

    if score >= 85:

        return (
            "Content requirement satisfied. Your resume contains "
            "strong career-related information and relevant sections."
        )

    if score >= 70:

        return (
            "Your resume contains the major sections. "
            "Adding stronger project details and measurable results "
            "can make it more impactful."
        )

    return (
        "Content needs improvement. Add relevant projects, "
        "experience, skills, certifications and achievements."
    )


# =========================================================
# READABILITY MESSAGE
# =========================================================

def get_readability_message(
    score: int
) -> str:

    if score >= 85:

        return (
            "Readability requirement satisfied. Your resume content "
            "is clear and easy to scan."
        )

    if score >= 70:

        return (
            "Readability is good. Keep bullet points concise and "
            "avoid unnecessarily long descriptions."
        )

    return (
        "Readability needs improvement. Use shorter bullet points, "
        "clear headings and concise descriptions."
    )


# =========================================================
# SUMMARY
# =========================================================

def get_summary(
    score: int,
    role: str
) -> str:

    if score >= 85:

        return (
            f"Your resume strongly satisfies the main requirements "
            f"for the {role} role."
        )

    if score >= 70:

        return (
            f"Your resume has a good foundation for the {role} role. "
            f"A few targeted improvements can make it stronger."
        )

    if score >= 50:

        return (
            f"Your resume contains useful information for the {role} role, "
            f"but several requirements need improvement."
        )

    return (
        f"Your resume needs improvement for the {role} role. "
        f"Focus on ATS compatibility, relevant keywords, content and readability."
    )