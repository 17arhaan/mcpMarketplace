# Copyright (c) 2025 Arhaan Girdhar. Licensed under AGPL-3.0.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, installs, ratings, tools

app = FastAPI(
    title="MCP Tool Marketplace",
    description="npm-style registry for Model Context Protocol tools",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tools.router)
app.include_router(installs.router)
app.include_router(ratings.router)


@app.get("/health")
def health():
    return {"status": "ok"}
