# The Drop — Backend

FastAPI backend for The Drop, served via Uvicorn.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

The server will start at `http://localhost:8000` by default.
