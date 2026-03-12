import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.routes import auth_routes, task_routes
from app.routes.activity_routes import router as activity_router
from app.routes.goals_routes import router as goals_router
from app.routes.insights_routes import router as insights_router
from app.routes.stats_routes import router as stats_router
from app.routes.template_routes import router as templates_router
from app.routes.user_routes import router as users_router
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.utils import database

load_dotenv()


def _build_allowed_origins() -> list[str]:
    default_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost",
        "http://127.0.0.1",
        "capacitor://localhost",
    ]

    env_origins: list[str] = []
    frontend_url = (os.getenv("FRONTEND_URL") or "").strip().rstrip("/")
    if frontend_url:
        env_origins.append(frontend_url)

    extra_origins_raw = os.getenv("CORS_ORIGINS", "")
    if extra_origins_raw:
        env_origins.extend([origin.strip().rstrip("/") for origin in extra_origins_raw.split(",") if origin.strip()])

    origins: list[str] = []
    for origin in [*default_origins, *env_origins]:
        if origin not in origins:
            origins.append(origin)
    return origins


def _build_origin_regex() -> str:
    # Accept Vercel preview/prod domains by default unless explicitly overridden.
    return os.getenv("CORS_ORIGIN_REGEX", r"^https://.*\.vercel\.app$")


@asynccontextmanager
async def lifespan(app: FastAPI):
    del app
    db_connected = await database.create_indexes()
    if db_connected:
        start_scheduler()
    else:
        print("Database indexes were not created; scheduler not started")
    print("AI Task Bot API running!")
    yield
    stop_scheduler()


app = FastAPI(
    title="AI Task Bot",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_origin_regex=_build_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    del request
    print(f"Database error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is unavailable. Please try again shortly."},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    del request
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(auth_routes.router)
app.include_router(task_routes.router)
app.include_router(stats_router)
app.include_router(users_router)
app.include_router(goals_router)
app.include_router(activity_router)
app.include_router(insights_router)
app.include_router(templates_router)


@app.get("/")
async def root():
    return {"message": "AI Task Bot API v3", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy", "database_ready": database.db_ready}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
