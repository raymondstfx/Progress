from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import auth, documents, resources
from backend.app.core.config import get_settings
from backend.app.db.database import Base, SessionLocal, engine
from backend.app.db.seed import seed_database

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(documents.router)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "backend"}
