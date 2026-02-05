"""
API Routes for Space Agent
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime

from app.models.schemas import (
    Location, SatellitePass, SatelliteProfile, SpaceWeatherStatus,
    ExplanationRequest, ExplanationResponse, ContextualQuery,
    AlertSubscription, SpaceEvent, ActivityFeed
)
from app.services.satellite_service import satellite_service
from app.services.space_weather_service import space_weather_service
from app.agents.space_agent import space_agent

# Create router
api_router = APIRouter()

# Satellite routes
satellite_router = APIRouter(prefix="/satellites", tags=["Satellites"])

@satellite_router.get("/overhead", response_model=List[SatellitePass])
async def get_overhead_satellites(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    alt: float = Query(0, ge=0, description="Altitude in meters"),
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    min_elevation: float = Query(10, ge=0, le=90, description="Minimum elevation")
):
    """Get satellites passing overhead for a location"""
    location = Location(latitude=lat, longitude=lon, altitude=alt)
    
    try:
        passes = await satellite_service.get_overhead_satellites(
            location=location,
            time_window_hours=hours,
            min_elevation=min_elevation
        )
        return passes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@satellite_router.get("/iss/next-pass", response_model=SatellitePass)
async def get_next_iss_pass(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    alt: float = Query(0, ge=0),
    min_elevation: float = Query(30, ge=0, le=90)
):
    """Get next good ISS pass"""
    location = Location(latitude=lat, longitude=lon, altitude=alt)
    
    try:
        pass_info = await satellite_service.get_next_iss_pass(
            location=location,
            min_elevation=min_elevation
        )
        
        if not pass_info:
            raise HTTPException(
                status_code=404,
                detail="No upcoming ISS passes meeting criteria"
            )
        
        return pass_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@satellite_router.get("/profile/{satellite_name}", response_model=SatelliteProfile)
async def get_satellite_profile(satellite_name: str):
    """Get detailed satellite profile"""
    try:
        profile = await satellite_service.get_satellite_profile(satellite_name)
        
        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"Satellite '{satellite_name}' not found"
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Space Weather routes
weather_router = APIRouter(prefix="/space-weather", tags=["Space Weather"])

@weather_router.get("/status", response_model=SpaceWeatherStatus)
async def get_space_weather_status():
    """Get current space weather status"""
    try:
        status = await space_weather_service.get_current_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@weather_router.get("/impact-explanation")
async def get_impact_explanation():
    """Get detailed impact explanation for current space weather"""
    try:
        status = await space_weather_service.get_current_status()
        impact = space_weather_service.generate_impact_explanation(status)
        return impact
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Agent/Chat routes
agent_router = APIRouter(prefix="/agent", tags=["AI Agent"])

@agent_router.post("/query")
async def contextual_query(query: ContextualQuery):
    """
    Ask the agent a question with automatic live context inclusion
    """
    try:
        response = await space_agent.handle_contextual_query(query)
        return {"response": response, "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@agent_router.post("/explain", response_model=ExplanationResponse)
async def explain(request: ExplanationRequest):
    """
    Get multi-mode explanation with citations
    """
    try:
        explanation = await space_agent.explain(request)
        return explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Activity Feed routes
feed_router = APIRouter(prefix="/feed", tags=["Activity Feed"])

@feed_router.get("/today", response_model=ActivityFeed)
async def get_today_feed():
    """Get today's space activity feed"""
    # Demo implementation
    events = []
    
    try:
        # Add space weather event
        status = await space_weather_service.get_current_status()
        events.append(SpaceEvent(
            event_id="sw-" + datetime.utcnow().strftime("%Y%m%d"),
            event_type="space_weather",
            timestamp=datetime.utcnow(),
            title="Space Weather Update",
            description=status.summary,
            severity=None,
            data={"kp": status.kp_current}
        ))
        
    except Exception as e:
        pass
    
    return ActivityFeed(
        period="today",
        events=events,
        summary=f"Today's space activity: {len(events)} notable events"
    )


# Include all routers
api_router.include_router(satellite_router)
api_router.include_router(weather_router)
api_router.include_router(agent_router)
api_router.include_router(feed_router)
