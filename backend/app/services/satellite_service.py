"""
Satellite tracking service using N2YO API and Skyfield
"""
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import structlog
import httpx
from skyfield.api import load, wgs84, EarthSatellite
from skyfield.toposlib import GeographicPosition

from app.core.config import settings
from app.models.schemas import (
    Location, SatellitePass, SatelliteProfile, 
    SatellitePosition, OrbitType
)

logger = structlog.get_logger()


class SatelliteService:
    """Service for satellite tracking and predictions"""
    
    # Well-known satellites
    SATELLITES = {
        "ISS": {"norad_id": "25544", "name": "ISS (ZARYA)"},
        "HUBBLE": {"norad_id": "20580", "name": "HST"},
        "TIANGONG": {"norad_id": "48274", "name": "TIANHE"},
    }
    
    def __init__(self):
        self.base_url = "https://api.n2yo.com/rest/v1/satellite"
        self.api_key = settings.N2YO_API_KEY
        self.ts = load.timescale()
        self.tle_cache = {}
        
    async def get_overhead_satellites(
        self,
        location: Location,
        time_window_hours: int = 24,
        min_elevation: float = 10
    ) -> List[SatellitePass]:
        """
        Get satellites overhead for a location
        
        Args:
            location: Observer location
            time_window_hours: How far ahead to predict
            min_elevation: Minimum elevation to consider (degrees)
            
        Returns:
            List of satellite passes
        """
        if settings.DEMO_MODE:
            return self._get_demo_passes(location)
        
        passes = []
        
        # Get passes for each major satellite
        for sat_key, sat_info in self.SATELLITES.items():
            try:
                sat_passes = await self._get_satellite_passes(
                    norad_id=sat_info["norad_id"],
                    location=location,
                    days=time_window_hours // 24 or 1,
                    min_elevation=min_elevation
                )
                passes.extend(sat_passes)
            except Exception as e:
                logger.error(
                    "Failed to get passes",
                    satellite=sat_key,
                    error=str(e)
                )
        
        # Sort by start time
        passes.sort(key=lambda p: p.start_time)
        
        return passes
    
    async def get_next_iss_pass(
        self,
        location: Location,
        min_elevation: float = 30
    ) -> Optional[SatellitePass]:
        """Get the next good ISS pass"""
        passes = await self.get_overhead_satellites(
            location=location,
            time_window_hours=48,
            min_elevation=min_elevation
        )
        
        # Filter for ISS only
        iss_passes = [p for p in passes if "ISS" in p.satellite_name]
        
        return iss_passes[0] if iss_passes else None
    
    async def _get_satellite_passes(
        self,
        norad_id: str,
        location: Location,
        days: int = 1,
        min_elevation: float = 10
    ) -> List[SatellitePass]:
        """Get passes from N2YO API"""
        
        url = f"{self.base_url}/visualpasses/{norad_id}/" \
              f"{location.latitude}/{location.longitude}/{location.altitude}/{days}/{min_elevation}"
        
        params = {"apiKey": self.api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
        
        passes = []
        for pass_data in data.get("passes", []):
            # Calculate if worth watching (elevation > 40° or very bright)
            worth_watching = (
                pass_data["maxEl"] > 40 or 
                (pass_data.get("mag", 5) < 0)
            )
            
            sat_pass = SatellitePass(
                satellite_name=data["info"]["satname"],
                satellite_id=int(data["info"]["satid"]),
                start_time=datetime.fromtimestamp(pass_data["startUTC"]),
                max_elevation_time=datetime.fromtimestamp(pass_data["maxUTC"]),
                end_time=datetime.fromtimestamp(pass_data["endUTC"]),
                max_elevation=pass_data["maxEl"],
                start_azimuth=pass_data["startAz"],
                max_azimuth=pass_data["maxAz"],
                end_azimuth=pass_data["endAz"],
                magnitude=pass_data.get("mag"),
                duration_seconds=pass_data["duration"],
                worth_watching=worth_watching,
                commentary=self._generate_commentary(pass_data, worth_watching)
            )
            passes.append(sat_pass)
        
        return passes
    
    def _generate_commentary(self, pass_data: dict, worth_watching: bool) -> str:
        """Generate human-friendly commentary about a pass"""
        max_el = pass_data["maxEl"]
        duration = pass_data["duration"]
        
        if not worth_watching:
            return "Low pass, may not be easily visible."
        
        if max_el > 70:
            visibility = "Overhead pass! Excellent viewing."
        elif max_el > 50:
            visibility = "High pass, very good viewing."
        elif max_el > 30:
            visibility = "Good pass, should be easy to spot."
        else:
            visibility = "Moderate pass, clear sky recommended."
        
        if duration < 180:
            time_note = "Quick pass"
        elif duration < 360:
            time_note = "Standard duration"
        else:
            time_note = "Long pass"
        
        return f"{visibility} {time_note} ({duration}s)."
    
    async def get_satellite_profile(
        self,
        satellite_name: str
    ) -> Optional[SatelliteProfile]:
        """Get detailed satellite profile"""
        
        # Check if it's a known satellite
        sat_info = None
        for key, info in self.SATELLITES.items():
            if key.lower() in satellite_name.lower() or \
               info["name"].lower() in satellite_name.lower():
                sat_info = info
                satellite_name = key
                break
        
        if not sat_info:
            return None
        
        # Return profile based on satellite
        profiles = {
            "ISS": SatelliteProfile(
                satellite_id=25544,
                name="International Space Station",
                norad_id="25544",
                purpose="Research laboratory and human spaceflight",
                orbit_type=OrbitType.LEO,
                altitude_km=408,
                speed_kmh=27600,
                country="International",
                why_care="The ISS is a continuously inhabited space station where "
                         "astronauts conduct scientific research in microgravity. "
                         "It's the brightest satellite and often visible to the naked eye.",
                recent_changes=None
            ),
            "HUBBLE": SatelliteProfile(
                satellite_id=20580,
                name="Hubble Space Telescope",
                norad_id="20580",
                purpose="Space telescope for astronomical observations",
                orbit_type=OrbitType.LEO,
                altitude_km=547,
                speed_kmh=27300,
                country="USA/ESA",
                why_care="Hubble has revolutionized astronomy with stunning images "
                         "and discoveries about the universe. Operating since 1990.",
                recent_changes=None
            ),
            "TIANGONG": SatelliteProfile(
                satellite_id=48274,
                name="Tiangong Space Station",
                norad_id="48274",
                purpose="Chinese space station",
                orbit_type=OrbitType.LEO,
                altitude_km=390,
                speed_kmh=27500,
                country="China",
                why_care="China's first long-term space station, continuously inhabited "
                         "since 2022. Conducting scientific research and technology demos.",
                recent_changes=None
            ),
        }
        
        return profiles.get(satellite_name)
    
    def _get_demo_passes(self, location: Location) -> List[SatellitePass]:
        """Return realistic demo data for passes"""
        now = datetime.utcnow()
        
        # Create realistic ISS pass for tonight
        tonight_7pm = now.replace(hour=19, minute=41, second=0, microsecond=0)
        if tonight_7pm < now:
            tonight_7pm += timedelta(days=1)
        
        return [
            SatellitePass(
                satellite_name="ISS (ZARYA)",
                satellite_id=25544,
                start_time=tonight_7pm,
                max_elevation_time=tonight_7pm + timedelta(minutes=3),
                end_time=tonight_7pm + timedelta(minutes=6),
                max_elevation=63.0,
                start_azimuth=225,  # SW
                max_azimuth=180,
                end_azimuth=45,  # NE
                magnitude=-3.5,
                duration_seconds=360,
                worth_watching=True,
                commentary="High pass, very good viewing. Standard duration (360s)."
            ),
            SatellitePass(
                satellite_name="ISS (ZARYA)",
                satellite_id=25544,
                start_time=tonight_7pm + timedelta(hours=13),
                max_elevation_time=tonight_7pm + timedelta(hours=13, minutes=2),
                end_time=tonight_7pm + timedelta(hours=13, minutes=5),
                max_elevation=45.0,
                start_azimuth=270,
                max_azimuth=180,
                end_azimuth=90,
                magnitude=-2.8,
                duration_seconds=300,
                worth_watching=True,
                commentary="Good pass, should be easy to spot. Standard duration (300s)."
            ),
        ]


# Global service instance
satellite_service = SatelliteService()
