import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from api.db import Base


class Install(Base):
    __tablename__ = "installs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tool_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    installed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
