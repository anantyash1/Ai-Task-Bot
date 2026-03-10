# import os
# from contextlib import asynccontextmanager

# from dotenv import load_dotenv
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pymongo.errors import PyMongoError

# from app.routes import auth_routes, task_routes
# from app.routes.activity_routes import router as activity_router
# from app.routes.goals_routes import router as goals_router
# from app.routes.insights_routes import router as insights_router
# from app.routes.stats_routes import router as stats_router
# from app.routes.template_routes import router as templates_router
# from app.routes.user_routes import router as users_router
# from app.services.scheduler_service import start_scheduler, stop_scheduler
# from app.utils import database

# load_dotenv()


# # @asynccontextmanager
# # async def lifespan(app: FastAPI):
# #     db_connected = await database.create_indexes()
# #     if db_connected:
# #         start_scheduler()
# #     yield
# #     stop_scheduler()


# # app = FastAPI(
# #     title="AI Task Bot",
# #     version="3.1.0",
# #     description="Smart productivity assistant",
# #     lifespan=lifespan,
# # )

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=[
# #         "http://localhost:5173",
# #         "http://localhost:5174",
# #         "http://127.0.0.1:5173",
# #         "http://127.0.0.1:5174",
# #         os.getenv("FRONTEND_URL", "http://localhost:5173"),
# #     ],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     from app.utils.database import create_indexes
#     from app.services.scheduler_service import start_scheduler
#     await create_indexes()
#     start_scheduler()
#     print(\"AI Task Bot API running!\")
#     yield
#     from app.services.scheduler_service import stop_scheduler
#     stop_scheduler()


# app = FastAPI(title=\"AI Task Bot\", version=\"3.0.0\", lifespan=lifespan)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[\"*\"],
#     allow_credentials=False,
#     allow_methods=[\"*\"],
#     allow_headers=[\"*\"],
# )


# @app.exception_handler(PyMongoError)
# async def mongo_error_handler(request: Request, exc: PyMongoError):
#     del request
#     return JSONResponse(
#         status_code=503,
#         content={"detail": "Database is unavailable. Please try again shortly."},
#     )


# app.include_router(auth_routes.router)
# app.include_router(task_routes.router)
# app.include_router(stats_router)
# app.include_router(users_router)
# app.include_router(goals_router)
# app.include_router(activity_router)
# app.include_router(insights_router)
# app.include_router(templates_router)


# # @app.get("/")
# # async def root():
# #     return {"message": "AI Task Bot API", "status": "ok", "version": "3.1.0"}


# # @app.get("/health")
# # async def health():
# #     return {"status": "healthy", "database_ready": database.db_ready}


# @app.get(\"/\")
# async def root():
#     return {\"message\": \"AI Task Bot API v3\", \"status\": \"ok\"}

# @app.get(\"/health\")
# async def health():
#     return {\"status\": \"healthy\"}


# if __name__ == \"__main__\":
#     import uvicorn
#     port = int(os.getenv(\"PORT\", 8002))
#     uvicorn.run(\"main:app\", host=\"0.0.0.0\", port=port)



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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database indexes on startup
    await database.create_indexes()
    start_scheduler()
    print("AI Task Bot API running!")
    yield
    stop_scheduler()


app = FastAPI(
    title="AI Task Bot",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS configuration – for production, restrict to your frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is unavailable. Please try again shortly."},
    )


# Include all routers
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
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port)