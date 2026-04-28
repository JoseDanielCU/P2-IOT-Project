from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import UserCreate
from app.core.security import hash_password


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserCreate):
    hashed = hash_password(user_data.password)
    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed,
        phone_number=user_data.phone_number,    
        user_type=user_data.user_type,
        household_name=user_data.household_name,
        address=user_data.address,
        city=user_data.city,
        postal_code=user_data.postal_code,
        primary_role=user_data.primary_role,
        installed_capacity_kwh=user_data.installed_capacity_kwh,
        energy_source_type=user_data.energy_source_type,
        average_monthly_consumption_kwh=user_data.average_monthly_consumption_kwh,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_user(db, user_id, user_data):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    user.full_name = user_data.full_name
    user.email = user_data.email

    db.commit()
    db.refresh(user)

    return user
