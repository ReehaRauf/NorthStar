"""
Space Agent - Main Application Entry Point
"""
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.routes import api_router
from app.services.scheduler import start_scheduler, stop_scheduler

# Setup logging
setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager - handles startup and shutdown events
    """
    # Startup
    logger.info("Starting Space Agent", environment=settings.ENVIRONMENT)
    
    if settings.ENABLE_SCHEDULER:
        logger.info("Starting background scheduler")
        await start_scheduler()
    
    logger.info("Space Agent started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Space Agent")
    
    if settings.ENABLE_SCHEDULER:
        logger.info("Stopping background scheduler")
        await stop_scheduler()
    
    logger.info("Space Agent shut down complete")


# Create FastAPI application
app = FastAPI(
    title="Space Agent API",
    description="Real-time space intelligence agent with satellite tracking, space weather monitoring, and AI-powered explanations",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Space Agent API",
        "version": "0.1.0",
        "docs": "/api/docs" if settings.DEBUG else "disabled in production",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "run:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD and settings.DEBUG,
        log_config=None,  # We use structlog
    )
