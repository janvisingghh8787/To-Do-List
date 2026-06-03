"""
routers/stats.py
────────────────
Aggregated stats used to power the sidebar dashboard.

Endpoint:
    GET /api/stats  →  { total, completed, pending, overdue, completion_rate, by_priority }
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from models.todo import Todo, Priority

router = APIRouter()


@router.get("/")
async def get_stats():
    now = datetime.now(timezone.utc)

    total     = await Todo.count()
    completed = await Todo.find(Todo.completed == True).count()
    pending   = total - completed
    overdue   = await Todo.find(
        Todo.completed == False,
        Todo.due_date < now,      # type: ignore
    ).count()

    completion_rate = round((completed / total) * 100) if total > 0 else 0

    by_priority = {}
    for p in Priority:
        by_priority[p.value] = await Todo.find(Todo.priority == p).count()

    return {
        "success": True,
        "data": {
            "total":           total,
            "completed":       completed,
            "pending":         pending,
            "overdue":         overdue,
            "completion_rate": completion_rate,
            "by_priority":     by_priority,
        },
    }
