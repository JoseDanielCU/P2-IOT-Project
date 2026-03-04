from fastapi import FastAPI
from app.core.database import engine, Base
from app.routers import auth_router
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS, CORS_CREDENTIALS, CORS_METHODS, CORS_HEADERS

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comunidad Energética API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

app.include_router(auth_router.router)