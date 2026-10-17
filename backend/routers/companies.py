from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import Company
from security import verify_access_token


router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)

security = HTTPBearer()


# ==========================================
# COMPANY REQUEST
# ==========================================

class CompanyRequest(BaseModel):
    name: str
    industry: str | None = None
    location: str | None = None
    website: str | None = None
    description: str | None = None


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token"
        )

    from models import User

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# ==========================================
# GET ALL COMPANIES
# ==========================================

@router.get("/")
def get_companies(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    companies = (
        db.query(Company)
        .order_by(Company.id.desc())
        .all()
    )

    return [
        {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "location": company.location,
            "website": company.website,
            "description": company.description,
            "created_at": company.created_at
        }
        for company in companies
    ]


# ==========================================
# GET SINGLE COMPANY
# ==========================================

@router.get("/{company_id}")
def get_company(
    company_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "location": company.location,
        "website": company.website,
        "description": company.description,
        "created_at": company.created_at
    }


# ==========================================
# CREATE COMPANY
# ==========================================

@router.post("/")
def create_company(
    company_data: CompanyRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only admins can create companies
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create companies"
        )

    existing_company = (
        db.query(Company)
        .filter(
            Company.name == company_data.name
        )
        .first()
    )

    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="Company already exists"
        )

    company = Company(
        name=company_data.name,
        industry=company_data.industry,
        location=company_data.location,
        website=company_data.website,
        description=company_data.description
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return {
        "message": "Company created successfully",
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "location": company.location,
            "website": company.website,
            "description": company.description,
            "created_at": company.created_at
        }
    }


# ==========================================
# UPDATE COMPANY
# ==========================================

@router.put("/{company_id}")
def update_company(
    company_id: int,
    company_data: CompanyRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only admins can update companies
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update companies"
        )

    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    company.name = company_data.name
    company.industry = company_data.industry
    company.location = company_data.location
    company.website = company_data.website
    company.description = company_data.description

    db.commit()
    db.refresh(company)

    return {
        "message": "Company updated successfully",
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "location": company.location,
            "website": company.website,
            "description": company.description,
            "created_at": company.created_at
        }
    }


# ==========================================
# DELETE COMPANY
# ==========================================

@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only admins can delete companies
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete companies"
        )

    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    db.delete(company)
    db.commit()

    return {
        "message": "Company deleted successfully"
    }