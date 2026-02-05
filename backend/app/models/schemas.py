"""
Core data models for Space Agent
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Enums
class ExplanationMode(str, Enum):
    """Different explanation styles"""
    QUICK = "quick"
    ELI10 = "eli10"
    STEM = "stem"
    SCIFI = "scifi"


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


class AlertType(str, Enum):
    """Types of alerts"""
    SPACE_WEATHER = "space_weather"
    SATELLITE_PASS = "satellite_pass"
    LAUNCH = "launch"


class OrbitType(str, Enum):
    """Satellite orbit classifications"""
    LEO = "leo"  # Low Earth Orbit
    MEO = "meo"  # Medium Earth Orbit
    GEO = "geo"  # Geostationary Orbit
    HEO = "heo"  # Highly Elliptical Orbit


# Location Models
class Location(BaseModel):
    """Geographic location"""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitude: float = Field(default=0, description="Altitude in meters")
    name: Optional[str] = None


# Satellite Models
class SatellitePass(BaseModel):
    """Satellite pass prediction"""
    satellite_name: str
    satellite_id: int
    start_time: datetime
    max_elevation_time: datetime
    end_time: datetime
    max_elevation: float = Field(description="Maximum elevation in degrees")
    start_azimuth: float = Field(description="Starting azimuth in degrees")
    max_azimuth: float = Field(description="Azimuth at max elevation")
    end_azimuth: float = Field(description="Ending azimuth in degrees")
    magnitude: Optional[float] = Field(default=None, description="Visual magnitude")
    duration_seconds: int
    worth_watching: bool = Field(description="Is this pass worth watching?")
    commentary: Optional[str] = None


class SatelliteProfile(BaseModel):
    """Detailed satellite information"""
    satellite_id: int
    name: str
    norad_id: str
    purpose: str
    orbit_type: OrbitType
    altitude_km: float
    speed_kmh: float
    launch_date: Optional[datetime] = None
    country: Optional[str] = None
    why_care: str = Field(description="Why people should care about this satellite")
    recent_changes: Optional[str] = None


class SatellitePosition(BaseModel):
    """Current satellite position"""
    satellite_name: str
    timestamp: datetime
    latitude: float
    longitude: float
    altitude_km: float
    azimuth: float
    elevation: float
    right_ascension: float
    declination: float
    distance_km: float


# Space Weather Models
class KpIndex(BaseModel):
    """Kp index (geomagnetic activity)"""
    timestamp: datetime
    value: float = Field(ge=0, le=9)
    description: str
    


class SolarFlare(BaseModel):
    """Solar flare event"""
    timestamp: datetime
    class_type: str = Field(description="Flare class: C, M, or X")
    scale: float = Field(description="Scale within class (e.g., M5.0)")
    region: Optional[str] = None
    peak_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class CME(BaseModel):
    """Coronal Mass Ejection"""
    timestamp: datetime
    speed_kms: float
    earth_directed: bool
    estimated_arrival: Optional[datetime] = None
    impact_probability: Optional[float] = Field(default=None, ge=0, le=1)


class SpaceWeatherStatus(BaseModel):
    """Current space weather status"""
    timestamp: datetime
    kp_current: float
    kp_forecast_3h: Optional[float] = None
    recent_flares: List[SolarFlare] = []
    active_cmes: List[CME] = []
    gps_degradation_risk: str = Field(description="none, minor, moderate, high")
    hf_radio_risk: str
    satellite_risk: str
    aurora_visibility: Optional[str] = None
    summary: str


class SpaceWeatherImpact(BaseModel):
    """Impact explanation for space weather event"""
    what_happened: str
    potential_impacts: List[str]
    who_should_care: List[str]
    actionable_guidance: str
    severity: AlertSeverity


# Alert Models
class AlertSubscription(BaseModel):
    """User alert subscription preferences"""
    user_id: str
    space_weather: Dict[str, Any] = Field(
        default={
            "kp_threshold": 5,
            "flare_classes": ["M", "X"],
            "storm_alert": True
        }
    )
    passes: Dict[str, Any] = Field(
        default={
            "min_elevation": 45,
            "reminder_minutes": 10,
            "satellites": ["ISS"]
        }
    )
    launches: Dict[str, Any] = Field(
        default={
            "enabled": True,
            "major_only": False,
            "days_ahead": 7
        }
    )
    quiet_hours: Dict[str, str] = Field(
        default={
            "start": "22:00",
            "end": "07:00"
        }
    )


class Alert(BaseModel):
    """Alert notification"""
    alert_id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    timestamp: datetime
    impact_explanation: Optional[SpaceWeatherImpact] = None
    data: Dict[str, Any] = Field(default_factory=dict)


# Launch Models
class Launch(BaseModel):
    """Rocket launch information"""
    launch_id: str
    name: str
    launch_time: datetime
    window_start: datetime
    window_end: datetime
    rocket: str
    mission: str
    site: str
    agency: str
    is_major: bool
    live_stream_url: Optional[str] = None


# Chat/Agent Models
class ChatMessage(BaseModel):
    """Chat message"""
    role: str = Field(description="user or assistant")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ExplanationRequest(BaseModel):
    """Request for an explanation"""
    query: str
    mode: ExplanationMode = ExplanationMode.QUICK
    include_citations: bool = True
    context: Optional[Dict[str, Any]] = None


class ExplanationResponse(BaseModel):
    """Response with explanation"""
    query: str
    mode: ExplanationMode
    explanation: str
    citations: List[str] = []
    confidence: float = Field(ge=0, le=1)
    sources: List[Dict[str, str]] = []


class ContextualQuery(BaseModel):
    """Query with automatic context inclusion"""
    query: str
    location: Optional[Location] = None
    include_live_context: bool = True
    explanation_mode: ExplanationMode = ExplanationMode.QUICK


# Activity Feed Models
class SpaceEvent(BaseModel):
    """Generic space event for activity feed"""
    event_id: str
    event_type: str
    timestamp: datetime
    title: str
    description: str
    severity: Optional[AlertSeverity] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class ActivityFeed(BaseModel):
    """Space activity feed"""
    period: str = Field(description="today, last_24h, last_week")
    events: List[SpaceEvent]
    summary: str
