# Policy in Action Library

This repository is the final GitHub Classroom submission repository for the Policy in Action Library project.

## Repository Structure

```text
frontend/   React + Vite frontend scaffold
backend/    FastAPI backend scaffold
docs/       Project documentation and design notes
uploads/    Local uploaded files for development only; ignored by Git
```

The current setup includes the repository structure, ignore rules, environment example, Docker Compose configuration, and a minimal runnable backend/frontend scaffold for later Sprint 1 feature work.

## Local Setup

Prerequisites:

```text
Git
Docker Desktop
Node.js 22 or later
Python 3.11 or later
```

Copy the environment template before local development:

```powershell
Copy-Item .env.example .env
```

Start the full Docker development stack:

```powershell
npm run dev
```

The default local services are:

```text
Frontend: http://localhost:5173
Backend API: http://localhost:8000
Backend health check: http://localhost:8000/api/health
PostgreSQL: localhost:5432
ChromaDB: http://localhost:8001
```

Install frontend dependencies for local non-Docker checks:

```powershell
npm run frontend:install
```

Run repository checks before opening a pull request:

```powershell
npm run check
```

Run individual checks when needed:

```powershell
python -m compileall backend
npm run frontend:typecheck
npm run frontend:build
docker compose config --quiet
```

## Development Workflow

All work must start from the latest `master` branch and be merged back through a pull request.

```powershell
git switch master
git pull origin master
git switch -c feature/W15CALMOND-XX-short-description
```

Use Jira-keyed branch names and commit messages. Record test evidence in the pull request before merge.

## Git Hygiene

Do not commit local or generated files, including:

```text
.env
node_modules/
frontend/dist/
uploads/
__pycache__/
*.pyc
.pytest_cache/
local database files
local vector-store data
```

All work should be completed on a Jira-keyed branch and merged through a pull request into `master`.
