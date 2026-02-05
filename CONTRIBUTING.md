# Contributing to Space Agent

First off, thank you for considering contributing to Space Agent! 🚀

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Python version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title**
- **Provide detailed description**
- **Explain why this enhancement would be useful**
- **List any alternative solutions** you've considered

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes**:
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
3. **Test your changes**:
   ```bash
   # Backend
   cd backend
   pytest
   
   # Frontend
   cd frontend
   npm test
   ```
4. **Commit your changes**:
   - Use clear commit messages
   - Reference issues if applicable
5. **Push to your fork** and submit a pull request

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Code Style

### Python (Backend)
- Follow PEP 8
- Use Black for formatting: `black app/`
- Use type hints where appropriate
- Write docstrings for functions and classes

### JavaScript/React (Frontend)
- Use ESLint configuration
- Prefer functional components and hooks
- Use meaningful variable names
- Keep components small and focused

## Project Structure

```
backend/
  app/
    agents/      # AI agent logic
    api/         # API routes
    core/        # Configuration
    models/      # Data models
    services/    # Business logic
    
frontend/
  src/
    components/  # Reusable components
    pages/       # Page components
    services/    # API clients
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## Documentation

- Update README.md for user-facing changes
- Add docstrings to new Python functions/classes
- Comment complex logic
- Update API documentation if endpoints change

## Areas Needing Help

We especially welcome contributions in these areas:

- 📊 **Data Visualization**: Improved charts and graphs
- 🎨 **UI/UX**: Design improvements and accessibility
- 📱 **Mobile**: Responsive design enhancements
- 🧪 **Testing**: More test coverage
- 📚 **Documentation**: Better guides and examples
- 🌐 **Internationalization**: Multi-language support
- 🔌 **Integrations**: New data sources and APIs

## Questions?

Feel free to open an issue with the `question` label or join our discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
