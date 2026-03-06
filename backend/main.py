import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.routes import auth_routes, task_routes
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.utils import database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_connected = await database.create_indexes()
    if db_connected:
        start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="AI Personal Task Bot",
    description="Smart productivity assistant with NLP task parsing",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    del request
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database is unavailable right now. Please try again in a moment.",
            "error": str(exc),
        },
    )


app.include_router(auth_routes.router)
app.include_router(task_routes.router)


@app.get("/")
async def root():
    return {"message": "AI Personal Task Bot API", "status": "running", "version": "1.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "database_ready": database.db_ready}
