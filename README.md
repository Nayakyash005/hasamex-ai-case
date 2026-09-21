# Hasamex AI Engineer Case Study

Minimal project scaffold for the Hasamex AI Engineer technical case study. It currently contains only a FastAPI health endpoint and a basic Next.js application; no AI, RAG, or product features have been implemented.

## Prerequisites

- Python 3.10 or newer
- Node.js 18.17 or newer

## Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The health check is available at `http://127.0.0.1:8000/health` and returns `{"status":"ok"}`.

## Frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.
