import motor.motor_asyncio
from beanie import init_beanie

from config import settings
from models.todo import Todo
from models.category import Category


async def init_db() -> None:
    try:
        print("MONGODB_URL =", settings.MONGODB_URL)
        print("DB_NAME =", settings.DB_NAME)

        client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)

        database = client[settings.DB_NAME]

        print("Connected client, initializing Beanie...")

        await init_beanie(
            database=database,
            document_models=[Todo, Category],
        )

        print(f"✅ MongoDB connected → db: '{settings.DB_NAME}'")

    except Exception as e:
        print("❌ STARTUP ERROR:", repr(e))
        raise