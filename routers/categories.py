"""
routers/categories.py
─────────────────────
CRUD endpoints for Task Categories.

Endpoints:
    GET    /api/categories        → list all
    POST   /api/categories        → create
    PUT    /api/categories/{id}   → update
    DELETE /api/categories/{id}   → delete (also unlinks todos)
"""

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from models.category import Category
from models.todo import Todo

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name:  str
    color: str  = "#6366f1"
    icon:  str  = "📁"


class CategoryUpdate(BaseModel):
    name:  Optional[str] = None
    color: Optional[str] = None
    icon:  Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(cat: Category) -> dict:
    return {
        "id":    str(cat.id),
        "name":  cat.name,
        "color": cat.color,
        "icon":  cat.icon,
    }


async def _get_or_404(cat_id: str) -> Category:
    try:
        oid = PydanticObjectId(cat_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid category id")
    cat = await Category.get(oid)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


# ── GET /api/categories ───────────────────────────────────────────────────────

@router.get("/")
async def list_categories():
    cats = await Category.find_all().sort(+Category.name).to_list()
    return {"success": True, "data": [_serialize(c) for c in cats]}


# ── POST /api/categories ──────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_category(body: CategoryCreate):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Category name is required")

    existing = await Category.find_one(Category.name == body.name.strip())
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")

    cat = Category(name=body.name.strip(), color=body.color, icon=body.icon)
    await cat.insert()
    return {"success": True, "data": _serialize(cat)}


# ── PUT /api/categories/{id} ──────────────────────────────────────────────────

@router.put("/{cat_id}")
async def update_category(cat_id: str, body: CategoryUpdate):
    cat = await _get_or_404(cat_id)
    if body.name  is not None: cat.name  = body.name.strip()
    if body.color is not None: cat.color = body.color
    if body.icon  is not None: cat.icon  = body.icon
    await cat.save()
    return {"success": True, "data": _serialize(cat)}


# ── DELETE /api/categories/{id} ───────────────────────────────────────────────

@router.delete("/{cat_id}")
async def delete_category(cat_id: str):
    cat = await _get_or_404(cat_id)
    await cat.delete()
    # Unlink all todos that belonged to this category
    await Todo.find(Todo.category.id == cat.id).update({"$set": {"category": None}})  # type: ignore
    return {"success": True, "message": "Category deleted and todos unlinked"}
