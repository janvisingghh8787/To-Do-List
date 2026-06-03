"""
models/category.py
──────────────────
Beanie document → maps to the 'categories' collection in MongoDB.
Pydantic validates every field automatically.
"""

from beanie import Document
from pydantic import Field


class Category(Document):
    name: str = Field(..., max_length=50)
    color: str = Field(default="#6366f1")   # hex colour shown in the UI
    icon: str = Field(default="📁")

    class Settings:
        name = "categories"   # MongoDB collection name
