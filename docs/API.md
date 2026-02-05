# NorthStart API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
Currently no authentication required. Future versions will support API keys.

---

## Endpoints

### Health Check

#### GET `/health`
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "demo_mode": false
}
```

---

## Satellite Endpoints

### Get Overhead Satellites

#### GET `/satellites/overhead`
Get all satellites passing overhead for a location.

**Query Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lon` (required): Longitude (-180 to 180)
- `alt` (optional): Altitude in meters (default: 0)
- `hours` (optional): Time window in hours (default: 24, max: 168)
- `min_elevation` (optional): Minimum elevation in degrees (default: 10)

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/satellites/overhead?lat=47.6062&lon=-122.3321&hours=24&min_elevation=30"
```

**Response:**
```json
[
  {
    "satellite_name": "ISS (ZARYA)",
    "satellite_id": 25544,
    "start_time": "2026-02-04T19:41:00Z",
    "max_elevation_time": "2026-02-04T19:44:00Z",
    "end_time": "2026-02-04T19:47:00Z",
    "max_elevation": 63.0,
    "start_azimuth": 225,
    "max_azimuth": 180,
    "end_azimuth": 45,
    "magnitude": -3.5,
    "duration_seconds": 360,
    "worth_watching": true,
    "commentary": "High pass, very good viewing. Standard duration (360s)."
  }
]
```

### Get Next ISS Pass

#### GET `/satellites/iss/next-pass`
Get the next good ISS pass.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `alt` (optional): Altitude in meters
- `min_elevation` (optional): Minimum elevation (default: 30)

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/satellites/iss/next-pass?lat=47.6062&lon=-122.3321"
```

**Response:** Same format as overhead satellites array, but returns single pass.

### Get Satellite Profile

#### GET `/satellites/profile/{satellite_name}`
Get detailed information about a satellite.

**Path Parameters:**
- `satellite_name`: Name of satellite (e.g., "ISS", "HUBBLE")

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/satellites/profile/ISS"
```

**Response:**
```json
{
  "satellite_id": 25544,
  "name": "International Space Station",
  "norad_id": "25544",
  "purpose": "Research laboratory and human spaceflight",
  "orbit_type": "leo",
  "altitude_km": 408,
  "speed_kmh": 27600,
  "country": "International",
  "why_care": "The ISS is a continuously inhabited space station...",
  "recent_changes": null
}
```

---

## Space Weather Endpoints

### Get Current Status

#### GET `/space-weather/status`
Get current space weather conditions.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/space-weather/status"
```

**Response:**
```json
{
  "timestamp": "2026-02-04T15:30:00Z",
  "kp_current": 5.0,
  "kp_forecast_3h": 5.3,
  "recent_flares": [
    {
      "timestamp": "2026-02-04T12:30:00Z",
      "class_type": "M",
      "scale": 5.2,
      "region": "AR3590",
      "peak_time": null,
      "end_time": null
    }
  ],
  "active_cmes": [],
  "gps_degradation_risk": "minor",
  "hf_radio_risk": "moderate",
  "satellite_risk": "minor",
  "aurora_visibility": "visible_high_latitudes",
  "summary": "Status: Active geomagnetic conditions (Kp 5.0). Minor GPS degradation possible; most users unaffected."
}
```

### Get Impact Explanation

#### GET `/space-weather/impact-explanation`
Get detailed explanation of current space weather impacts.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/space-weather/impact-explanation"
```

**Response:**
```json
{
  "what_happened": "Kp index: 5.0; 1 M-class solar flare(s)",
  "potential_impacts": [
    "GPS accuracy may be reduced for precision applications",
    "HF radio communications may experience disruption"
  ],
  "who_should_care": [
    "Drone operators",
    "Ham radio operators"
  ],
  "actionable_guidance": "Monitor for GPS accuracy if doing precision work. Ham radio operators may experience propagation changes.",
  "severity": "moderate"
}
```

---

## AI Agent Endpoints

### Contextual Query

#### POST `/agent/query`
Ask the agent a question with automatic live context.

**Request Body:**
```json
{
  "query": "What's the Kp index and should I worry about GPS?",
  "location": {
    "latitude": 47.6062,
    "longitude": -122.3321,
    "altitude": 0
  },
  "include_live_context": true,
  "explanation_mode": "quick"
}
```

**Explanation Modes:**
- `quick`: 5-8 lines, practical
- `eli10`: Simple language with metaphors
- `stem`: Technical with correct terminology
- `scifi`: Narrative style, accurate but exciting

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/agent/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "When can I see the ISS tonight?",
    "location": {"latitude": 47.6062, "longitude": -122.3321},
    "include_live_context": true,
    "explanation_mode": "quick"
  }'
```

**Response:**
```json
{
  "response": "The ISS will be visible tonight at 7:41 PM, reaching a maximum elevation of 63° in the southwest to northeast direction. This is an excellent viewing opportunity with clear skies. The pass will last about 6 minutes.",
  "timestamp": "2026-02-04T15:30:00Z"
}
```

### Get Explanation

#### POST `/agent/explain`
Get a detailed explanation with citations.

**Request Body:**
```json
{
  "query": "What is a CME?",
  "mode": "stem",
  "include_citations": true
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/agent/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the Kp index?",
    "mode": "quick",
    "include_citations": true
  }'
```

**Response:**
```json
{
  "query": "What is the Kp index?",
  "mode": "quick",
  "explanation": "The Kp index measures geomagnetic activity on a scale of 0-9. Values 0-4 indicate quiet conditions, 5-6 show active conditions with possible minor storms, and 7-9 indicate moderate to severe geomagnetic storms. Higher Kp values can affect GPS accuracy, radio communications, and may cause auroras at lower latitudes.",
  "citations": [
    "NOAA Space Weather Prediction Center"
  ],
  "confidence": 0.9,
  "sources": [
    {
      "title": "NOAA Space Weather Prediction Center",
      "snippet": "The Kp index is a geomagnetic activity index ranging from 0-9..."
    }
  ]
}
```

---

## Activity Feed Endpoints

### Get Today's Feed

#### GET `/feed/today`
Get today's space activity digest.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/feed/today"
```

**Response:**
```json
{
  "period": "today",
  "events": [
    {
      "event_id": "sw-20260204",
      "event_type": "space_weather",
      "timestamp": "2026-02-04T15:30:00Z",
      "title": "Space Weather Update",
      "description": "Status: Active geomagnetic conditions (Kp 5.0)...",
      "severity": null,
      "data": {"kp": 5.0}
    }
  ],
  "summary": "Today's space activity: 1 notable events"
}
```

---

## Error Responses

All endpoints may return these error codes:

### 400 Bad Request
```json
{
  "detail": "Invalid latitude value"
}
```

### 404 Not Found
```json
{
  "detail": "Satellite 'UNKNOWN' not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to fetch satellite data"
}
```

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Burst**: Up to 200 requests
- Exceeding limits returns `429 Too Many Requests`

---

## Demo Mode

Set `DEMO_MODE=true` in environment to use sample data without API keys.

---

## WebSocket Support (Coming Soon)

Real-time updates will be available via WebSocket:
```
ws://localhost:8000/ws
```

Topics:
- `space_weather`: Real-time space weather updates
- `satellite_passes`: Upcoming pass notifications
- `alerts`: Alert notifications
