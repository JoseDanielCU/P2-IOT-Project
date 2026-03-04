# Energy Community Web Platform 

## Overview
This project consists of porting an existing mobile application into a web application for energy communities. The platform allows households and companies to monitor energy production and consumption and to trade energy within the community.

Additionally, the system includes a forecasting module that predicts future energy consumption and production using collected data. These predictions support decision-making and improve energy distribution between households with surplus and households with deficit.

---

## Main Modules
- Web Frontend (Dashboards and user interface)
- Backend API (Authentication, business logic, trading system)
- Database (Users, households, energy records, transactions)
- Forecasting Module (Production/consumption prediction)

---

## Technologies
- Frontend: React / Next.js, TailwindCSS, WebSockets, Chart.js  
- Backend: Python FastAPI, REST API, JWT Auth  
- Database: PostgreSQL  
- Forecasting: Python, Pandas, NumPy, AI agent 
- Deployment: Docker, Docker Compose  
- CI/CD: GitHub Actions
- Code Quality: Ruff (Python), ESLint + Prettier (JavaScript)

---

## Documentation
Full documentation is available in the repository:
- [SECURITY.md](SECURITY.md) - Security policy and vulnerability tracking
- [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) - PR template

Additional documentation in Wiki:
- Project definition and scope
- Requirements elicitation process and evidence
- User story mapping and product backlog
- Architecture design
- Competitor analysis

---

## Git Workflow (GitHub Flow)

This project uses **GitHub Flow** for collaboration. The `main` branch is protected and requires Pull Requests with at least 1 approval.

### Quick Workflow:
1. **Update main**: `git checkout main && git pull origin main`
2. **Create branch**: `git checkout -b feature/your-task-name`
3. **Work & commit**: Make changes and commit frequently
4. **Push**: `git push origin feature/your-task-name`
5. **Create PR**: On GitHub, create Pull Request and assign 1 reviewer
6. **Review & merge**: After approval, merge on GitHub
7. **Cleanup**: `git checkout main && git pull && git branch -d feature/your-task-name`

### Branch Naming:
- `feature/` - New features (e.g., `feature/energy-predictions`)
- `fix/` - Bug fixes (e.g., `fix/login-validation`)
- `refactor/` - Code improvements (e.g., `refactor/user-service`)

### Commit Convention:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Code formatting
- `test:` - Tests

### Code Quality:
- **Backend**: Run `ruff check app/` and `ruff format app/` before committing
- **Frontend**: Run `npm run lint` and `npm run format` before committing

### Security Scanning:
- **Backend**: Run `bandit -r app/` to detect security vulnerabilities
- **Backend**: Run `pip-audit` to audit dependencies
- **Frontend**: Run `npm audit` to check for vulnerable packages

---

## Installation and Setup

### 🐳 Quick Start with Docker (Recommended)

#### For Daily Development (Hot-Reload)
Use this when developing features - your code changes update automatically:

```bash
# Start all services with hot-reload enabled
docker-compose -f docker-compose.dev.yml up

# Access the application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

#### For Final Deployment (Production Build)
Use this for the final deployment - optimized and fast:

```bash
# Build and start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# To remove volumes (delete database data)
docker-compose down -v
```

**What's included:**
- ✅ PostgreSQL database (automatically configured)
- ✅ FastAPI backend (with hot-reload in dev mode)
- ✅ Next.js frontend (with hot-reload in dev mode)
- ✅ All services communicate automatically

### 💻 Local Development Setup

#### Backend (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API URL

# Run development server
npm run dev
```

#### Database (PostgreSQL)
```bash
# Install PostgreSQL locally or use Docker:
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=energy_community \
  -p 5432:5432 \
  postgres:16-alpine
```

### 🧪 Running Tests

```bash
# Backend linting and formatting
cd backend
ruff check app/
ruff format app/
bandit -r app/

# Frontend linting and formatting
cd frontend
npm run lint
npm run format
npm audit
```

---
## Authors
- Jose Daniel Castañeda  
- Martin Caballero  
- Juan Jose Vargas  
- Arturo Arias  
- Samuel Gutierrez  
