from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.schemas.user_schema import UserResponse, UserUpdate
from app.auth.services.user_service import update_user
from app.core.database import SessionLocal


router = APIRouter(prefix="/api/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    updated_user = update_user(db, current_user.id, user_data)

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return updated_user
