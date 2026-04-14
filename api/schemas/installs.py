from pydantic import BaseModel
import uuid
from datetime import datetime


class InstallRequest(BaseModel):
    tool_id: uuid.UUID
    version: str | None = None


class InstallOut(BaseModel):
    id: uuid.UUID
    tool_id: uuid.UUID
    version: str | None
    installed_at: datetime

    model_config = {"from_attributes": True}
