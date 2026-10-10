"""
WeCare.AI Main Application

FastAPI application factory with all routes and middleware.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api import health, patients, assessments, queue, voice
from app.exceptions import WeCareException, http_exception_from_wecare

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {settings.database_url}")
    logger.info(f"Clinical Rules: {settings.rules_version}")
    logger.info(f"Min Assessment Age: {settings.min_assessment_age}")
    logger.info(f"Speech Transcription: {'Enabled' if settings.speech_transcription_enabled else 'Disabled'}")

    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    # Log speech service status
    from app.services.speech_service import get_speech_service
    speech_service = get_speech_service()
    speech_status = speech_service.get_status()
    logger.info(f"Speech Service: {'Configured' if speech_status.configured else 'Not Configured'}")
    if speech_status.configured:
        logger.info(f"Supported Languages: {list(speech_status.supported_languages.keys())}")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "WeCare.AI - Multilingual Emergency Triage Decision Support\n\n"
            "Backend API for AI-powered emergency triage and patient prioritization.\n"
            "Implements WHO IITT criteria for patients aged 12+.\n\n"
            "## Clinical Safety\n"
            "- Deterministic rules engine based on WHO IITT\n"
            "- Explicit handling of missing/unknown information\n"
            "- No autonomous diagnosis or treatment recommendations\n"
            "- Audit trail for all assessments\n\n"
            "## Supported Languages\n"
            "- English (en-IN)\n"
            "- Tamil (ta-IN)\n"
            "- Telugu (te-IN)\n"
            "- Hindi (hi-IN)"
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler for WeCareException
    @app.exception_handler(WeCareException)
    async def wecare_exception_handler(request: Request, exc: WeCareException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code.value, "message": exc.message, "details": exc.details}},
        )

    # Include routers
    app.include_router(health.router)
    app.include_router(patients.router)
    app.include_router(assessments.router)
    app.include_router(queue.router)
    app.include_router(voice.router)

    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "docs": "/docs",
            "health": "/api/health",
        }

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )