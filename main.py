"""
main.py
───────
FastAPI application entry point.

Run with:
    uvicorn main:app --reload
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from database import init_db
from config import settings
from routers import todos, categories, stats


# ── Lifespan: runs once on startup & shutdown ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("STARTING APP")
    await init_db()
    yield


# ── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Todo API",
    description="A smart, aesthetic todo app powered by FastAPI + MongoDB",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",        # Swagger UI  →  http://localhost:8000/docs
    redoc_url="/redoc",      # ReDoc UI    →  http://localhost:8000/redoc
)


# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(todos.router,      prefix="/api/todos",      tags=["Todos"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(stats.router,      prefix="/api/stats",      tags=["Stats"])


# ── Serve static files (HTML/CSS/JS frontend) ────────────────────────────────
# Guard: only mount if the directory actually exists (prevents crash on Render
# when the static/ folder hasn't been committed to the repo yet).
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Catch-all: serve index.html for any non-API route ────────────────────────
@app.get("/", include_in_schema=False)
async def serve_frontend():
    index = "static/index.html"
    if os.path.isfile(index):
        return FileResponse(index)
    # Fallback: API is live but no frontend built yet
    return JSONResponse({
        "status": "ok",
        "message": "Smart Todo API is running. Visit /docs for Swagger UI.",
    })


# ── Run directly with `python main.py` ───────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
