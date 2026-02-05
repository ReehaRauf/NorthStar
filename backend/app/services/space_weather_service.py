"""
Space Weather monitoring service using NOAA SWPC data
"""
from datetime import datetime, timedelta
from typing import List, Optional
import structlog
import httpx

from app.core.config import settings
from app.models.schemas import (
    KpIndex, SolarFlare, CME, SpaceWeatherStatus,
    SpaceWeatherImpact, AlertSeverity
)

logger = structlog.get_logger()


class SpaceWeatherService:
    """Service for space weather monitoring and forecasting"""
    
    def __init__(self):
        self.base_url = settings.NOAA_SWPC_BASE_URL
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes
    
    async def get_current_status(self) -> SpaceWeatherStatus:
        """
        Get current space weather status
        
        Returns comprehensive status including Kp, flares, CMEs, and impacts
        """
        if settings.DEMO_MODE:
            return self._get_demo_status()
        
        # Fetch all data in parallel
        kp, flares, cmes = await asyncio.gather(
            self._get_current_kp(),
            self._get_recent_flares(),
            self._get_active_cmes(),
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(kp, Exception):
            logger.error("Failed to fetch Kp", error=str(kp))
            kp = 3.0  # Default moderate value
        
        if isinstance(flares, Exception):
            logger.error("Failed to fetch flares", error=str(flares))
            flares = []
        
        if isinstance(cmes, Exception):
            logger.error("Failed to fetch CMEs", error=str(cmes))
            cmes = []
        
        # Determine impact levels
        gps_risk = self._assess_gps_risk(kp, cmes)
        hf_risk = self._assess_hf_radio_risk(flares)
        sat_risk = self._assess_satellite_risk(kp, flares, cmes)
        aurora_vis = self._assess_aurora_visibility(kp)
        
        # Generate summary
        summary = self._generate_status_summary(
            kp, flares, cmes, gps_risk, hf_risk, sat_risk
        )
        
        return SpaceWeatherStatus(
            timestamp=datetime.utcnow(),
            kp_current=kp,
            kp_forecast_3h=None,  # TODO: Add forecast
            recent_flares=flares,
            active_cmes=cmes,
            gps_degradation_risk=gps_risk,
            hf_radio_risk=hf_risk,
            satellite_risk=sat_risk,
            aurora_visibility=aurora_vis,
            summary=summary
        )
    
    async def _get_current_kp(self) -> float:
        """Fetch current Kp index from NOAA"""
        url = f"{self.base_url}/products/noaa-planetary-k-index-forecast.json"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                data = response.json()
            
            # NOAA returns array of arrays
            if isinstance(data, list) and len(data) > 1:
                # Skip header row, get last data row
                latest = data[-1]
                if isinstance(latest, list) and len(latest) >= 2:
                    return float(latest[1])  # Kp value is second column
        except Exception as e:
            logger.error("Kp fetch failed", error=str(e))
        
        return 3.0  # Default
    
    async def _get_recent_flares(self, hours: int = 24) -> List[SolarFlare]:
        """Fetch recent solar flares"""
        # NOAA doesn't have a simple JSON endpoint for flares
        # Using a simplified approach - just return empty for now
        # In production, you'd parse the text reports or use a different data source
        return []
    
    async def _get_active_cmes(self) -> List[CME]:
        """Fetch active CME alerts"""
        # TODO: Implement CME tracking from DONKI or other sources
        return []
    
    def _assess_gps_risk(self, kp: float, cmes: List[CME]) -> str:
        """Assess GPS degradation risk"""
        if kp >= 7 or any(cme.earth_directed for cme in cmes):
            return "high"
        elif kp >= 5:
            return "moderate"
        elif kp >= 4:
            return "minor"
        return "none"
    
    def _assess_hf_radio_risk(self, flares: List[SolarFlare]) -> str:
        """Assess HF radio degradation risk"""
        if not flares:
            return "none"
        
        # Check for recent strong flares
        recent_strong = [
            f for f in flares 
            if f.class_type in ["M", "X"] and 
            (datetime.utcnow() - f.timestamp).seconds < 3600
        ]
        
        if any(f.class_type == "X" for f in recent_strong):
            return "high"
        elif recent_strong:
            return "moderate"
        return "minor"
    
    def _assess_satellite_risk(
        self,
        kp: float,
        flares: List[SolarFlare],
        cmes: List[CME]
    ) -> str:
        """Assess satellite operations risk"""
        if kp >= 8 or any(f.class_type == "X" and f.scale > 5 for f in flares):
            return "high"
        elif kp >= 6 or any(f.class_type == "X" for f in flares):
            return "moderate"
        elif kp >= 5:
            return "minor"
        return "none"
    
    def _assess_aurora_visibility(self, kp: float) -> str:
        """Assess aurora visibility"""
        if kp >= 8:
            return "visible_mid_latitudes"
        elif kp >= 6:
            return "visible_high_latitudes"
        elif kp >= 4:
            return "visible_polar_regions"
        return "unlikely"
    
    def _generate_status_summary(
        self,
        kp: float,
        flares: List[SolarFlare],
        cmes: List[CME],
        gps_risk: str,
        hf_risk: str,
        sat_risk: str
    ) -> str:
        """Generate human-readable status summary"""
        
        # Kp description
        if kp < 4:
            kp_desc = "Quiet geomagnetic conditions"
        elif kp < 5:
            kp_desc = "Unsettled geomagnetic conditions"
        elif kp < 6:
            kp_desc = "Active geomagnetic conditions"
        elif kp < 7:
            kp_desc = "Minor geomagnetic storm"
        elif kp < 8:
            kp_desc = "Moderate geomagnetic storm"
        else:
            kp_desc = "Strong geomagnetic storm"
        
        summary = f"Status: {kp_desc} (Kp {kp:.1f})."
        
        # Add specific impacts if relevant
        impacts = []
        if gps_risk in ["moderate", "high"]:
            impacts.append(f"{gps_risk.capitalize()} GPS degradation possible")
        if hf_risk in ["moderate", "high"]:
            impacts.append(f"{hf_risk.capitalize()} HF radio disruption")
        
        if impacts:
            summary += " " + "; ".join(impacts) + "."
        else:
            summary += " Most users unaffected."
        
        return summary
    
    def generate_impact_explanation(
        self,
        status: SpaceWeatherStatus
    ) -> SpaceWeatherImpact:
        """Generate detailed impact explanation"""
        
        # Determine what happened
        what_happened_parts = [f"Kp index: {status.kp_current:.1f}"]
        
        if status.recent_flares:
            flare_count = len(status.recent_flares)
            strong_flares = [f for f in status.recent_flares if f.class_type in ["M", "X"]]
            if strong_flares:
                what_happened_parts.append(
                    f"{len(strong_flares)} {strong_flares[0].class_type}-class solar flare(s)"
                )
        
        if status.active_cmes:
            what_happened_parts.append(f"{len(status.active_cmes)} active CME(s)")
        
        what_happened = "; ".join(what_happened_parts)
        
        # Potential impacts
        impacts = []
        if status.gps_degradation_risk != "none":
            impacts.append("GPS accuracy may be reduced for precision applications")
        if status.hf_radio_risk != "none":
            impacts.append("HF radio communications may experience disruption")
        if status.satellite_risk != "none":
            impacts.append("Satellite operations may experience anomalies")
        if status.aurora_visibility != "unlikely":
            impacts.append("Aurora may be visible at lower latitudes than usual")
        
        # Who should care
        who_cares = []
        if status.gps_degradation_risk in ["moderate", "high"]:
            who_cares.extend(["Drone operators", "Surveyors", "Aviation professionals"])
        if status.hf_radio_risk in ["moderate", "high"]:
            who_cares.extend(["Ham radio operators", "Maritime communications", "Emergency services"])
        if status.satellite_risk in ["moderate", "high"]:
            who_cares.extend(["Satellite operators", "Space agencies"])
        
        if not who_cares:
            who_cares = ["Space weather enthusiasts"]
        
        # Actionable guidance
        if status.kp_current < 5:
            guidance = "Continue normal operations. Monitor for updates."
        elif status.kp_current < 7:
            guidance = ("Monitor for GPS accuracy if doing precision work. "
                       "Ham radio operators may experience propagation changes.")
        else:
            guidance = ("Consider delaying precision GPS work. Satellite operators "
                       "should monitor spacecraft health. Aurora photographers: "
                       "good opportunity tonight!")
        
        # Determine severity
        if status.kp_current >= 7:
            severity = AlertSeverity.HIGH
        elif status.kp_current >= 5:
            severity = AlertSeverity.MODERATE
        else:
            severity = AlertSeverity.INFO
        
        return SpaceWeatherImpact(
            what_happened=what_happened,
            potential_impacts=impacts,
            who_should_care=who_cares,
            actionable_guidance=guidance,
            severity=severity
        )
    
    def _get_demo_status(self) -> SpaceWeatherStatus:
        """Return demo space weather status"""
        return SpaceWeatherStatus(
            timestamp=datetime.utcnow(),
            kp_current=5.0,
            kp_forecast_3h=5.3,
            recent_flares=[
                SolarFlare(
                    timestamp=datetime.utcnow() - timedelta(hours=3),
                    class_type="M",
                    scale=5.2,
                    region="AR3590"
                )
            ],
            active_cmes=[],
            gps_degradation_risk="minor",
            hf_radio_risk="moderate",
            satellite_risk="minor",
            aurora_visibility="visible_high_latitudes",
            summary="Status: Active geomagnetic conditions (Kp 5.0). "
                   "Minor GPS degradation possible; most users unaffected."
        )


# Global service instance
import asyncio
space_weather_service = SpaceWeatherService()