# 🛰️ Space Agent

> **Mission Control + Science Tutor + Space Weather Watchdog**

A real-time space intelligence agent that tells you what's happening above Earth right now, explains space phenomena clearly (with receipts), and warns you when solar activity might mess with comms/GPS/satellites.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.0+-61DAFB.svg)](https://reactjs.org/)

## ✨ Features

### 🎯 Live Space Operations (Mission Control Brain)
- **"What's above me?"** - Track ISS and satellites overhead in real-time
- **Pass Predictions** - Get next 10 passes with smart filtering
- **Satellite Profiles** - Understand what each satellite does and why it matters
- **Space Activity Feed** - Daily digest of notable events

### ⚠️ Space Weather (Watchdog + Risk Assessment)
- **Real-time Status** - Continuous Kp index, solar flare, and CME monitoring
- **Smart Alerts** - Configurable notifications with deduplication and quiet hours
- **Impact Explainer** - Clear, actionable guidance on what space weather means for you

### 📚 Science Explainer (Tutor + RAG)
- **Multi-mode Explanations** - Quick, ELI10, STEM, or Sci-fi modes
- **Citation-backed** - Every answer sourced from NASA/NOAA/ESA docs
- **Event Analysis** - Deep dives into specific space events

### 🎨 User Experience
- **Conversational AI** - Context-aware responses that don't spam
- **Live Context** - Automatic inclusion of relevant current data
- **Demo Mode** - Deterministic sample data for testing and screenshots

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- API keys (optional for demo mode):
  - [N2YO.com](https://www.n2yo.com/api/) for satellite tracking
  - [NOAA Space Weather](https://www.swpc.noaa.gov/) (free, no key needed)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/space-agent.git
cd space-agent

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys (optional for demo mode)

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local

# Run in development
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 📁 Project Structure

```
space-agent/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── agents/          # AI agent logic
│   │   ├── api/             # API routes
│   │   ├── core/            # Core configurations
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── data/                # Knowledge base & sample data
│   ├── tests/               # Backend tests
│   └── requirements.txt
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   ├── store/           # State management
│   │   └── utils/           # Utilities
│   └── public/
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── docker/                  # Docker configurations
```

## 🎮 Usage Examples

### Ask about overhead satellites
```
User: "What's above me right now?"
Agent: "ISS is approaching! Visible pass tonight at 7:41 PM 
       (max 63° elevation, SW→NE, 6 min). Best view starts 7:42."
```

### Check space weather
```
User: "Should I worry about GPS today?"
Agent: "Status: Moderate geomagnetic activity (Kp 5). 
       Minor GPS degradation possible for precision applications. 
       Regular navigation unaffected."
```

### Learn space science
```
User: "What's a CME?" [STEM mode]
Agent: "A Coronal Mass Ejection is a large-scale expulsion of plasma 
       and magnetic field from the solar corona. CMEs can eject 
       billions of tons of coronal material at speeds up to 3000 km/s..."
       
       Sources:
       - NASA Space Weather Guide (2024)
       - NOAA SWPC Technical Documentation
```

## 🔧 Configuration

### Alert Subscriptions

Configure alerts in Settings or via chat:

```javascript
{
  "spaceWeather": {
    "kpThreshold": 5,
    "flareClasses": ["M", "X"],
    "stormAlert": true
  },
  "passes": {
    "minElevation": 45,
    "reminderMinutes": 10
  },
  "launches": {
    "enabled": true,
    "majorOnly": false
  },
  "quietHours": {
    "start": "22:00",
    "end": "07:00"
  }
}
```

### Explanation Modes

- **Quick**: 5–8 lines, practical
- **ELI10**: Metaphors + simple language
- **STEM**: Correct terms + mild math
- **Sci-fi**: Narrative tone, still accurate

## 🧪 Demo Mode

For testing without API keys:

```bash
# Backend
DEMO_MODE=true python run.py

# Frontend
VITE_DEMO_MODE=true npm run dev
```

Demo mode uses realistic sample data from `backend/data/samples/`.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pytest` for backend, `npm test` for frontend)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📊 Data Sources

- **Satellite Tracking**: [N2YO.com API](https://www.n2yo.com/api/)
- **Space Weather**: [NOAA SWPC](https://www.swpc.noaa.gov/)
- **TLE Data**: [CelesTrak](https://celestrak.org/)
- **Launch Data**: [Launch Library 2](https://thespacedevs.com/llapi)
- **Knowledge Base**: NASA, ESA, NOAA documentation

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA for space weather data and educational resources
- NOAA Space Weather Prediction Center
- N2YO for satellite tracking API
- The open-source space community

## 📞 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/space-agent/issues)
- Discussions: [Join the conversation](https://github.com/yourusername/space-agent/discussions)

---

**Built with 🚀 by space enthusiasts, for space enthusiasts**
