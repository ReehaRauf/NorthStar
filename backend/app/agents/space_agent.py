"""
AI Agent service for natural language interactions and explanations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog
from anthropic import Anthropic

from app.core.config import settings
from app.models.schemas import (
    ExplanationMode, ExplanationRequest, ExplanationResponse,
    ContextualQuery, ChatMessage, Location
)
from app.services.satellite_service import satellite_service
from app.services.space_weather_service import space_weather_service

logger = structlog.get_logger()


class SpaceAgentService:
    """
    AI-powered space agent using Claude for natural conversations
    and multi-mode explanations
    """
    
    # Knowledge base snippets (in production, load from files)
    KB_SNIPPETS = {
        "kp_index": {
            "content": "The Kp index is a geomagnetic activity index ranging from 0-9. "
                      "It measures disturbances in Earth's magnetic field caused by solar activity. "
                      "Values 0-4 are quiet, 5-6 are active/minor storm, 7-8 are moderate/strong storm, "
                      "9 is severe storm. Higher Kp can affect GPS, radio, satellites, and cause auroras.",
            "source": "NOAA Space Weather Prediction Center"
        },
        "cme": {
            "content": "A Coronal Mass Ejection (CME) is a massive burst of solar wind and magnetic fields "
                      "rising above the solar corona or being released into space. CMEs can eject billions of "
                      "tons of coronal material at speeds of 100-3000 km/s. Earth-directed CMEs can trigger "
                      "geomagnetic storms, affecting satellites, communications, and power grids.",
            "source": "NASA Space Weather Guide"
        },
        "solar_flare": {
            "content": "Solar flares are intense bursts of radiation from the release of magnetic energy. "
                      "They're classified by X-ray brightness: C (weak), M (medium), X (strong). "
                      "Each class is 10x stronger than the previous. Flares can disrupt radio communications "
                      "and navigation systems on the sunlit side of Earth.",
            "source": "NASA Solar Dynamics Observatory"
        },
        "leo": {
            "content": "Low Earth Orbit (LEO) is between 160-2000 km altitude. LEO satellites orbit Earth "
                      "in ~90 minutes. Most human spaceflight occurs here (ISS at ~400km). LEO satellites "
                      "experience more atmospheric drag and require periodic reboosts.",
            "source": "ESA Space Environment Statistics"
        },
    }
    
    # Mode-specific system prompts
    MODE_PROMPTS = {
        ExplanationMode.QUICK: (
            "Provide a concise, practical explanation in 5-8 lines. "
            "Focus on what matters to regular people."
        ),
        ExplanationMode.ELI10: (
            "Explain using simple language and metaphors a 10-year-old would understand. "
            "Be engaging and fun but accurate."
        ),
        ExplanationMode.STEM: (
            "Provide a technical explanation with correct terminology. "
            "Include relevant numbers, formulas, and physics. Suitable for students/professionals."
        ),
        ExplanationMode.SCIFI: (
            "Explain with narrative flair and vivid imagery, like a science fiction story. "
            "Keep it accurate but make it exciting and immersive."
        ),
    }
    
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
        self.model = "claude-sonnet-4-20250514"
    
    async def handle_contextual_query(
        self,
        query: ContextualQuery
    ) -> str:
        """
        Handle a query with automatic live context inclusion
        
        Args:
            query: User query with context preferences
            
        Returns:
            Agent response with live data when relevant
        """
        # Build context
        context_parts = []
        
        if query.include_live_context:
            # Add space weather if relevant
            if any(word in query.query.lower() for word in 
                   ["weather", "gps", "storm", "kp", "flare", "aurora", "cme"]):
                try:
                    status = await space_weather_service.get_current_status()
                    context_parts.append(
                        f"Current space weather: {status.summary}"
                    )
                except Exception as e:
                    logger.error("Failed to fetch space weather", error=str(e))
            
            # Add satellite passes if relevant and location provided
            if query.location and any(word in query.query.lower() for word in
                                     ["iss", "satellite", "overhead", "visible", "pass", "tonight"]):
                try:
                    next_pass = await satellite_service.get_next_iss_pass(query.location)
                    if next_pass:
                        context_parts.append(
                            f"Next ISS pass: {next_pass.start_time.strftime('%I:%M %p')} "
                            f"({next_pass.max_elevation:.0f}° elevation)"
                        )
                except Exception as e:
                    logger.error("Failed to fetch satellite pass", error=str(e))
        
        # Build full prompt
        system_prompt = self._build_system_prompt(query.explanation_mode)
        
        user_message = query.query
        if context_parts:
            user_message = f"Live context:\n" + "\n".join(context_parts) + "\n\n" + query.query
        
        # Get response from Claude
        if not self.client:
            return self._fallback_response(query.query, context_parts)
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            return response.content[0].text
            
        except Exception as e:
            logger.error("Claude API error", error=str(e))
            return self._fallback_response(query.query, context_parts)
    
    async def explain(
        self,
        request: ExplanationRequest
    ) -> ExplanationResponse:
        """
        Generate explanation with citations
        
        Args:
            request: Explanation request with query and mode
            
        Returns:
            Detailed explanation with sources
        """
        # Search knowledge base for relevant content
        kb_results = self._search_kb(request.query)
        
        # Build prompt
        system_prompt = self._build_system_prompt(request.mode)
        
        kb_context = ""
        sources = []
        if kb_results and request.include_citations:
            kb_context = "\n\nRelevant knowledge:\n"
            for result in kb_results[:3]:
                kb_context += f"- {result['content']}\n  Source: {result['source']}\n"
                sources.append({
                    "title": result["source"],
                    "snippet": result["content"][:100] + "..."
                })
        
        user_message = f"{request.query}{kb_context}"
        
        # Get explanation
        if not self.client:
            explanation = self._fallback_explanation(request.query, request.mode)
            citations = [r["source"] for r in kb_results[:2]] if kb_results else []
            confidence = 0.7
        else:
            try:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=1500,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}]
                )
                explanation = response.content[0].text
                citations = [r["source"] for r in kb_results] if kb_results else []
                confidence = 0.9 if kb_results else 0.6
            except Exception as e:
                logger.error("Claude API error in explain", error=str(e))
                explanation = self._fallback_explanation(request.query, request.mode)
                citations = []
                confidence = 0.5
        
        return ExplanationResponse(
            query=request.query,
            mode=request.mode,
            explanation=explanation,
            citations=citations,
            confidence=confidence,
            sources=sources
        )
    
    def _build_system_prompt(self, mode: ExplanationMode) -> str:
        """Build system prompt based on explanation mode"""
        base_prompt = (
            "You are a space weather and satellite tracking expert. "
            "You explain space phenomena clearly and accurately. "
            "When live context is provided, incorporate it naturally into your response. "
        )
        
        mode_specific = self.MODE_PROMPTS.get(mode, self.MODE_PROMPTS[ExplanationMode.QUICK])
        
        return base_prompt + mode_specific
    
    def _search_kb(self, query: str) -> List[Dict[str, str]]:
        """
        Simple keyword-based KB search
        In production: use vector embeddings and semantic search
        """
        query_lower = query.lower()
        results = []
        
        # Simple keyword matching
        if any(word in query_lower for word in ["kp", "geomagnetic", "magnetic"]):
            results.append(self.KB_SNIPPETS["kp_index"])
        
        if any(word in query_lower for word in ["cme", "coronal", "mass ejection"]):
            results.append(self.KB_SNIPPETS["cme"])
        
        if any(word in query_lower for word in ["flare", "solar flare", "x-class", "m-class"]):
            results.append(self.KB_SNIPPETS["solar_flare"])
        
        if any(word in query_lower for word in ["leo", "orbit", "altitude"]):
            results.append(self.KB_SNIPPETS["leo"])
        
        return results
    
    def _fallback_response(self, query: str, context: List[str]) -> str:
        """Fallback response when Claude API unavailable"""
        if context:
            return f"Based on current conditions:\n" + "\n".join(context) + \
                   f"\n\nRegarding your question about '{query}': " \
                   "I'd need more specific data to give you a detailed answer. " \
                   "Please check the space weather dashboard for real-time information."
        else:
            return ("I'm currently unable to provide a detailed response. "
                   "Please check the space weather and satellite tracking dashboards "
                   "for current information.")
    
    def _fallback_explanation(self, query: str, mode: ExplanationMode) -> str:
        """Fallback explanation when Claude API unavailable"""
        kb_results = self._search_kb(query)
        
        if kb_results:
            return kb_results[0]["content"]
        
        return ("I don't have detailed information about this topic in my knowledge base. "
               "Please refer to NASA, NOAA, or ESA resources for authoritative information.")


# Global agent instance
space_agent = SpaceAgentService()
