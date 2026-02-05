# Space Agent Architecture

## Overview

Space Agent is a full-stack application that provides real-time space intelligence through satellite tracking, space weather monitoring, and AI-powered explanations.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Anthropic Claude API
- **Space APIs**:
  - N2YO for satellite tracking
  - NOAA SWPC for space weather
  - CelesTrak for TLE data
- **Database**: PostgreSQL (SQLite for dev)
- **Cache**: Redis
- **Background Tasks**: APScheduler

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Animation**: Framer Motion
- **Charts**: Recharts

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │  Passes  │  │  Weather │  │   Chat   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         │                                    │
│                    React Router                              │
│                         │                                    │
│                   API Client (Axios)                         │
└─────────────────────────│───────────────────────────────────┘
                          │
                     HTTP/REST API
                          │
┌─────────────────────────│───────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │              API Routes (/api/v1)                 │       │
│  │  /satellites  /space-weather  /agent  /feed      │       │
│  └──────────────────────────────────────────────────┘       │
│                         │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │  Satellite  │  │   Space     │  │   AI Agent   │        │
│  │  Service    │  │   Weather   │  │   Service    │        │
│  │             │  │   Service   │  │              │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
│         │                │                  │                │
│         │                │                  │                │
└─────────│────────────────│──────────────────│────────────────┘
          │                │                  │
          │                │                  │
    ┌─────▼─────┐    ┌────▼────┐      ┌─────▼──────┐
    │   N2YO    │    │  NOAA   │      │ Anthropic  │
    │    API    │    │  SWPC   │      │  Claude    │
    └───────────┘    └─────────┘      └────────────┘
```

## Core Components

### Backend Services

#### 1. Satellite Service (`satellite_service.py`)
- **Responsibility**: Track satellites and predict passes
- **Data Sources**: N2YO API, Skyfield calculations
- **Key Functions**:
  - `get_overhead_satellites()`: Find all satellites overhead
  - `get_next_iss_pass()`: Get next ISS visible pass
  - `get_satellite_profile()`: Detailed satellite information

#### 2. Space Weather Service (`space_weather_service.py`)
- **Responsibility**: Monitor solar activity and geomagnetic conditions
- **Data Sources**: NOAA SWPC
- **Key Functions**:
  - `get_current_status()`: Current space weather
  - `generate_impact_explanation()`: User-friendly impact assessment
  - Risk assessment for GPS, radio, satellites

#### 3. AI Agent Service (`space_agent.py`)
- **Responsibility**: Natural language interface and explanations
- **AI Model**: Claude Sonnet 4
- **Features**:
  - Multi-mode explanations (Quick, ELI10, STEM, Sci-fi)
  - Contextual queries with live data
  - Citation-backed knowledge base
  - Conversation management

#### 4. Background Scheduler (`scheduler.py`)
- **Responsibility**: Periodic data updates
- **Tasks**:
  - Space weather updates (every 5 minutes)
  - TLE data updates (daily)
  - Alert processing

### Frontend Pages

#### 1. HomePage
- Live space weather status cards
- Today's activity feed
- Quick action links
- Real-time Kp index display

#### 2. PassesPage
- Satellite pass predictions
- Location-based tracking
- ISS visibility calculator
- Pass commentary and recommendations

#### 3. SpaceWeatherPage
- Current status dashboard
- Risk level indicators
- Impact explanations
- Solar flare history

#### 4. ChatPage
- Conversational AI interface
- Multi-mode explanations
- Live context inclusion
- Message history

## Data Flow

### Satellite Pass Prediction
1. User requests passes for location
2. Frontend calls `/api/v1/satellites/overhead`
3. Backend queries N2YO API or uses Skyfield
4. Calculations determine visibility, elevation, timing
5. Results formatted with human-friendly commentary
6. Response cached for 10 minutes

### Space Weather Updates
1. Background scheduler runs every 5 minutes
2. Fetch current Kp index from NOAA
3. Get recent solar flares and CMEs
4. Assess impact levels (GPS, radio, satellites)
5. Generate summary and explanations
6. Store in cache and database
7. Check for alert conditions

### AI Chat Interaction
1. User sends message with selected mode
2. Frontend includes live context flag
3. Backend gathers relevant live data:
   - Current space weather if mentioned
   - Next satellite pass if location provided
4. Construct prompt with context
5. Call Claude API with mode-specific instructions
6. Search knowledge base for citations
7. Return formatted response with sources

## Caching Strategy

- **Space Weather**: 5-minute cache
- **Satellite Passes**: 10-minute cache per location
- **Knowledge Base**: Persistent, refreshed daily
- **API Responses**: Redis cache with TTL

## Error Handling

- **API Failures**: Graceful degradation, use cached data
- **Rate Limits**: Request queuing and backoff
- **Invalid Input**: Validation at API layer
- **Demo Mode**: Fallback to sample data

## Security

- **API Keys**: Environment variables, never committed
- **CORS**: Configured for specific origins
- **Rate Limiting**: Per-IP request limits
- **Input Validation**: Pydantic models
- **SQL Injection**: ORM parameterized queries

## Performance Optimizations

- **Frontend**:
  - Code splitting by route
  - Lazy loading of components
  - React Query for caching
  - Debounced API calls
  
- **Backend**:
  - Async/await throughout
  - Database connection pooling
  - Response compression (GZip)
  - Background task processing

## Monitoring & Logging

- **Structured Logging**: Structlog with JSON output
- **Log Levels**: DEBUG, INFO, WARNING, ERROR
- **Metrics**: Request timing, error rates
- **Health Checks**: `/health` endpoint

## Deployment

### Development
```bash
docker-compose up
```

### Production
- Backend: Containerized with gunicorn
- Frontend: Static build served via nginx
- Database: Managed PostgreSQL instance
- Cache: Managed Redis instance
- Background tasks: Separate worker container

## Scalability Considerations

- **Horizontal Scaling**: Stateless API servers
- **Database**: Read replicas for queries
- **Cache**: Redis cluster
- **Background Tasks**: Celery for distribution
- **CDN**: Static assets via CDN

## Future Enhancements

1. **WebSocket Support**: Real-time updates
2. **Mobile Apps**: React Native version
3. **Advanced Alerts**: Email, SMS, push notifications
4. **User Accounts**: Personalized settings and history
5. **More Data Sources**: Additional space APIs
6. **Machine Learning**: Predictive models for space weather
7. **3D Visualization**: Satellite orbits in 3D
8. **Collaboration**: Share observations and alerts
