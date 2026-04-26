from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Table, Text, func
from sqlalchemy.dialects.postgresql import JSON

if TYPE_CHECKING:
    from api.models.user import User
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.db import Base

tool_tags = Table(
    "tool_tags",
    Base.metadata,
    Column("tool_id", UUID(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class ToolStatus(str, enum.Enum):
    draft = "draft"
    pending_review = "pending_review"
    active = "active"
    rejected = "rejected"
    deprecated = "deprecated"
    removed = "removed"


class SandboxStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    passed = "passed"
    failed = "failed"


class Tool(Base):
    __tablename__ = "tools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latest_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    install_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    status: Mapped[ToolStatus] = mapped_column(Enum(ToolStatus, name="tool_status"), default=ToolStatus.draft)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    versions: Mapped[list["ToolVersion"]] = relationship(
        "ToolVersion", back_populates="tool", cascade="all, delete-orphan"
    )
    author: Mapped[User] = relationship("User", foreign_keys=[author_id])
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=tool_tags, lazy="joined")


class ToolVersion(Base):
    __tablename__ = "tool_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tool_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mcp_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    sandbox_status: Mapped[SandboxStatus] = mapped_column(
        Enum(SandboxStatus, name="sandbox_status"), default=SandboxStatus.pending
    )
    sandbox_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tool: Mapped[Tool] = relationship("Tool", back_populates="versions")
