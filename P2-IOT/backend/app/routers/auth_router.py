from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.user_schema import UserCreate, Token
from app.services.user_service import create_user, get_user_by_email
from app.core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    new_user = create_user(db, user.full_name, user.email, user.password)

    token = create_access_token({"sub": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }
