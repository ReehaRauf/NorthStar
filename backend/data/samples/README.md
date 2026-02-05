# Demo Data for Space Agent

This directory contains sample data for demo mode, allowing the application to run without external API keys.

## Files

- `space_weather.json`: Sample space weather status
- `satellite_passes.json`: Sample ISS pass predictions
- `knowledge_base/`: Sample knowledge base articles

## Usage

Set `DEMO_MODE=true` in `backend/.env` to use this sample data instead of making real API calls.

This is useful for:
- Development and testing
- Demos and screenshots
- CI/CD pipelines
- Offline development
