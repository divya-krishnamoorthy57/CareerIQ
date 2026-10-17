from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


# =========================
# USER MODEL
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        default="student",
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# =========================
# STUDENT PROFILE MODEL
# =========================


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=True
    )

    location = Column(
        String(150),
        nullable=True
    )

    college = Column(
        String(150),
        nullable=True
    )

    degree = Column(
        String(100),
        nullable=True
    )

    department = Column(
        String(100),
        nullable=True
    )

    graduation_year = Column(
        Integer,
        nullable=True
    )

    cgpa = Column(
        String(10),
        nullable=True
    )

    skills = Column(
        String(1000),
        nullable=True
    )

    career_goal = Column(
        String(150),
        nullable=True
    )

    preferred_job_role = Column(
        String(150),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

# =========================
# COMPANY MODEL
# =========================
class Company(Base):
    __tablename__ = "companies"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    industry = Column(
        String(100),
        nullable=True
    )

    location = Column(
        String(150),
        nullable=True
    )

    website = Column(
        String(255),
        nullable=True
    )

    description = Column(
        String(1000),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    location = Column(
        String(150),
        nullable=True
    )

    description = Column(
        String(2000),
        nullable=True
    )

    required_skills = Column(
        String(1000),
        nullable=True
    )

    salary = Column(
        String(100),
        nullable=True
    )

    job_type = Column(
        String(50),
        nullable=True
    )

    application_deadline = Column(
        DateTime,
        nullable=True
    )

    source_name = Column(
    String(150),
    nullable=True
    )

    source_url = Column(
    String(500),
    nullable=True
    )

    application_url = Column(
    String(1000),
    nullable=True
   )

    published_date = Column(
        DateTime,
        nullable=True
    )

    last_checked_at = Column(
        DateTime,
        nullable=True
    )

    status = Column(
        String(30),
        default="active",
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    application_url = Column(String(500), nullable=True)

class Application(Base):
    __tablename__ = "applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    status = Column(
        String(30),
        default="applied",
        nullable=False
    )

    applied_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )