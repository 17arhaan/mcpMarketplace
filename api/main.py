# Copyright (c) 2025 Arhaan Girdhar. Licensed under AGPL-3.0.
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.db import Base, engine
from api.models import install, rating, tool, user  # noqa: F401 — register models
from api.routers import admin, auth, installs, ratings, tools


def _run_migrations() -> None:
    """Apply additive schema changes that create_all won't handle on existing tables."""
    from sqlalchemy import text

    with engine.begin() as conn:
        # Add is_admin column if missing (added after initial deploy)
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
        # Add new tool_status enum values if missing
        for val in ("pending_review", "rejected"):
            conn.execute(text(f"ALTER TYPE tool_status ADD VALUE IF NOT EXISTS '{val}'"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _run_migrations()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MCP Tool Marketplace",
    description="npm-style registry for Model Context Protocol tools",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://(.*\.)?mcpmarketplace\.online|https://.*\.vercel\.app|http://localhost:(3000|3001)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tools.router)
app.include_router(installs.router)
app.include_router(ratings.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
