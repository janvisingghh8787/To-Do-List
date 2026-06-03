"""
models/todo.py
──────────────
Beanie document → maps to the 'todos' collection in MongoDB.

Priority levels follow an intentional order so the frontend can sort smartly:
    urgent > high > medium > low
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from beanie import Document, Link
from pydantic import Field, model_validator

from models.category import Category


class Priority(str, Enum):
    low    = "low"
    medium = "medium"
    high   = "high"
    urgent = "urgent"

    # Numeric weight used for sorting
    @property
    def weight(self) -> int:
        return {"low": 1, "medium": 2, "high": 3, "urgent": 4}[self.value]


class Todo(Document):
    title:       str            = Field(..., max_length=200)
    description: str            = Field(default="", max_length=1000)
    completed:   bool           = Field(default=False)
    priority:    Priority       = Field(default=Priority.medium)
    category:    Optional[Link[Category]] = Field(default=None)
    due_date:    Optional[datetime]       = Field(default=None)
    completed_at: Optional[datetime]     = Field(default=None)
    tags:        list[str]      = Field(default_factory=list)
    created_at:  datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:  datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))

    # ── Computed helpers (not stored) ────────────────────────────────────────
    @property
    def is_overdue(self) -> bool:
        if not self.due_date or self.completed:
            return False
        due = self.due_date

    # Convert old MongoDB naive datetimes to UTC-aware
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)

        return datetime.now(timezone.utc) > due

    # ── Auto-set completed_at ────────────────────────────────────────────────
    @model_validator(mode="after")
    def sync_completed_at(self) -> "Todo":
        if self.completed and self.completed_at is None:
            self.completed_at = datetime.now(timezone.utc)
        if not self.completed:
            self.completed_at = None
        return self

    class Settings:
        name = "todos"   # MongoDB collection name
