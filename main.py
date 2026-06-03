"""
main.py
───────
FastAPI application entry point.

Run with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db
from config import settings
from routers import todos, categories, stats


# ── Lifespan: runs once on startup & shutdown ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()          # connect to MongoDB + init Beanie
    yield
    print("👋  Shutting down…")


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
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Catch-all: serve index.html for any non-API route ────────────────────────
@app.get("/", include_in_schema=False)
async def serve_frontend():
    return FileResponse("static/index.html")


# ── Run directly with `python main.py` ───────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
