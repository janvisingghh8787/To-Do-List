"""
routers/todos.py
────────────────
All CRUD endpoints for Todo items.

Endpoints:
    GET    /api/todos           → list all (with filters)
    POST   /api/todos           → create
    GET    /api/todos/{id}      → get one
    PUT    /api/todos/{id}      → update
    PATCH  /api/todos/{id}/toggle → toggle completed
    DELETE /api/todos/{id}      → delete one
    DELETE /api/todos/completed/all → bulk-delete completed
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from beanie.operators import RegEx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from models.todo import Todo, Priority
from models.category import Category

router = APIRouter()


# ── Request / Response schemas (Pydantic) ────────────────────────────────────

class TodoCreate(BaseModel):
    title:       str
    description: str            = ""
    priority:    Priority       = Priority.medium
    category_id: Optional[str]  = None
    due_date:    Optional[datetime] = None
    tags:        list[str]      = []


class TodoUpdate(BaseModel):
    title:       Optional[str]      = None
    description: Optional[str]     = None
    priority:    Optional[Priority] = None
    category_id: Optional[str]     = None
    due_date:    Optional[datetime] = None
    tags:        Optional[list[str]] = None
    completed:   Optional[bool]    = None


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_or_404(todo_id: str) -> Todo:
    try:
        oid = PydanticObjectId(todo_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid todo id")
    todo = await Todo.get(oid, fetch_links=True)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


def _serialize(todo: Todo) -> dict:
    """Convert a Todo document to a plain dict safe for JSON."""
    cat = None
    if todo.category and not isinstance(todo.category, PydanticObjectId):
        cat = {
            "id":    str(todo.category.id),
            "name":  todo.category.name,
            "color": todo.category.color,
            "icon":  todo.category.icon,
        }
    return {
        "id":           str(todo.id),
        "title":        todo.title,
        "description":  todo.description,
        "completed":    todo.completed,
        "priority":     todo.priority.value,
        "category":     cat,
        "due_date":     todo.due_date.isoformat() if todo.due_date else None,
        "completed_at": todo.completed_at.isoformat() if todo.completed_at else None,
        "tags":         todo.tags,
        "is_overdue":   todo.is_overdue,
        "created_at":   todo.created_at.isoformat(),
        "updated_at":   todo.updated_at.isoformat(),
    }


# ── GET /api/todos ────────────────────────────────────────────────────────────

@router.get("/")
async def list_todos(
    completed:  Optional[bool] = Query(None),
    priority:   Optional[Priority] = Query(None),
    category:   Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
    sort_by:    str = Query("created_at", alias="sortBy"),
    order:      str = Query("desc"),
):
    query_filters = []

    if completed is not None:
        query_filters.append(Todo.completed == completed)
    if priority:
        query_filters.append(Todo.priority == priority)
    if search:
        query_filters.append(RegEx(Todo.title, search, options="i"))
    if category:
        try:
            cat_oid = PydanticObjectId(category)
            query_filters.append(Todo.category.id == cat_oid)   # type: ignore
        except Exception:
            pass

    find_query = Todo.find(*query_filters, fetch_links=True)

    # Sorting
    sort_field = getattr(Todo, sort_by, Todo.created_at)
    if order == "asc":
        find_query = find_query.sort(+sort_field)
    else:
        find_query = find_query.sort(-sort_field)

    try:
        todos = await find_query.to_list()
        print("TODOS FOUND:", len(todos))
        data = []
        for t in todos:
            print("SERIALIZING:", t.id)
            data.append(_serialize(t))
        return {
            "success": True,
            "count": len(todos),
            "data": data
        }

    except Exception as e:
        print("LIST TODOS ERROR:", repr(e))
        raise


# ── POST /api/todos ───────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_todo(body: TodoCreate):
    if not body.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    category = None
    if body.category_id:
        try:
            category = await Category.get(PydanticObjectId(body.category_id))
        except Exception:
            pass

    todo = Todo(
        title=body.title.strip(),
        description=body.description.strip(),
        priority=body.priority,
        category=category,
        due_date=body.due_date,
        tags=body.tags,
    )
    await todo.insert()
    await todo.fetch_all_links()
    return {"success": True, "data": _serialize(todo)}


# ── GET /api/todos/{id} ───────────────────────────────────────────────────────

@router.get("/{todo_id}")
async def get_todo(todo_id: str):
    todo = await _get_or_404(todo_id)
    return {"success": True, "data": _serialize(todo)}


# ── PUT /api/todos/{id} ───────────────────────────────────────────────────────

@router.put("/{todo_id}")
async def update_todo(todo_id: str, body: TodoUpdate):
    todo = await _get_or_404(todo_id)

    if body.title is not None:
        todo.title = body.title.strip()
    if body.description is not None:
        todo.description = body.description.strip()
    if body.priority is not None:
        todo.priority = body.priority
    if body.due_date is not None:
        todo.due_date = body.due_date
    if body.tags is not None:
        todo.tags = body.tags
    if body.completed is not None:
        todo.completed = body.completed
    if body.category_id is not None:
        try:
            cat = await Category.get(PydanticObjectId(body.category_id))
            todo.category = cat
        except Exception:
            todo.category = None

    todo.updated_at = datetime.now(timezone.utc)
    await todo.save()
    await todo.fetch_all_links()
    return {"success": True, "data": _serialize(todo)}


# ── PATCH /api/todos/{id}/toggle ─────────────────────────────────────────────

@router.patch("/{todo_id}/toggle")
async def toggle_todo(todo_id: str):
    try:
        todo = await _get_or_404(todo_id)

        todo.completed = not todo.completed
        todo.completed_at = datetime.now(timezone.utc) if todo.completed else None
        todo.updated_at = datetime.now(timezone.utc)

        await todo.save()
        await todo.fetch_all_links()

        return {"success": True, "data": _serialize(todo)}

    except Exception as e:
        print("TOGGLE ERROR:", repr(e))
        raise


# ── DELETE /api/todos/completed/all ──────────────────────────────────────────

@router.delete("/completed/all")
async def delete_completed():
    result = await Todo.find(Todo.completed == True).delete()
    return {"success": True, "message": f"Deleted {result.deleted_count} completed todos"}


# ── DELETE /api/todos/{id} ────────────────────────────────────────────────────

@router.delete("/{todo_id}")
async def delete_todo(todo_id: str):
    todo = await _get_or_404(todo_id)
    await todo.delete()
    return {"success": True, "message": "Todo deleted successfully"}
