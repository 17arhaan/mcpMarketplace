import uuid
from sqlalchemy import String, Text, Integer, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from api.db import Base


class ToolStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
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
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latest_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    install_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    status: Mapped[ToolStatus] = mapped_column(Enum(ToolStatus, name="tool_status"), default=ToolStatus.draft)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    versions: Mapped[list["ToolVersion"]] = relationship("ToolVersion", back_populates="tool", cascade="all, delete-orphan")
    author: Mapped["User"] = relationship("User", foreign_keys=[author_id])  # type: ignore[name-defined]


class ToolVersion(Base):
    __tablename__ = "tool_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tool_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mcp_schema: Mapped[dict | None] = mapped_column(nullable=True)
    sandbox_status: Mapped[SandboxStatus] = mapped_column(Enum(SandboxStatus, name="sandbox_status"), default=SandboxStatus.pending)
    sandbox_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tool: Mapped[Tool] = relationship("Tool", back_populates="versions")
