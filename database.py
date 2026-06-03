"""
database.py
───────────
Async MongoDB connection using Motor + Beanie ODM.
Called once at startup inside main.py lifespan.
"""

import motor.motor_asyncio
from beanie import init_beanie

from config import settings
from models.todo import Todo
from models.category import Category


async def init_db() -> None:
    print("MONGODB_URL =", settings.MONGODB_URL)
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DB_NAME]

    await init_beanie(
        database=database,
        document_models=[Todo, Category],
    )
    print(f"✅  MongoDB connected  →  db: '{settings.DB_NAME}'")
