import uuid
from datetime import datetime

from pydantic import BaseModel

from api.models.tool import SandboxStatus, ToolStatus


class ToolVersionOut(BaseModel):
    id: uuid.UUID
    version: str
    sandbox_status: SandboxStatus
    published_at: datetime
    mcp_schema: dict | None = None

    model_config = {"from_attributes": True}


class ToolOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str
    latest_version: str | None
    install_count: int
    avg_rating: float | None
    status: ToolStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ToolDetail(ToolOut):
    versions: list[ToolVersionOut] = []
    author_username: str | None = None
    author_email: str | None = None


class ToolCreate(BaseModel):
    name: str
    slug: str
    description: str
    version: str
    mcp_schema: dict


class ToolListResponse(BaseModel):
    tools: list[ToolOut]
    total: int
    page: int
    limit: int
