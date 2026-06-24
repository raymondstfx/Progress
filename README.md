# Policy in Action Library

This repository is the final GitHub Classroom submission repository for the Policy in Action Library project.

## Repository Structure

```text
frontend/   React + Vite + Tailwind frontend application
backend/    FastAPI backend application
docs/       Project documentation and design notes
uploads/    Local uploaded files for development only; ignored by Git
```

The current setup task establishes the repository structure and ignore rules. Application code, Docker configuration, and environment examples are handled by later Repository Setup subtasks.

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
