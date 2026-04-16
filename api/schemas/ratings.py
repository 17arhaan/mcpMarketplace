import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class RatingRequest(BaseModel):
    tool_id: uuid.UUID
    score: int
    review: str | None = None

    @field_validator("score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("score must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tool_id: uuid.UUID
    score: int
    review: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RatingListResponse(BaseModel):
    ratings: list[RatingOut]
    total: int
    page: int
    limit: int
