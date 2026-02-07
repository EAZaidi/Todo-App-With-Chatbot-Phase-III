"""
Migration script to add priority and due_date columns to tasks table.
Run this once to add the new columns.
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


async def migrate():
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        future=True,
        poolclass=NullPool,
        connect_args={"ssl": "require"},
    )

    async with engine.begin() as conn:
        # Add priority column
        try:
            await conn.execute(text("""
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' NOT NULL
            """))
            print("Added priority column")
        except Exception as e:
            print(f"Priority column might already exist: {e}")

        # Add due_date column
        try:
            await conn.execute(text("""
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL
            """))
            print("Added due_date column")
        except Exception as e:
            print(f"Due_date column might already exist: {e}")

    await engine.dispose()
    print("Migration completed!")


if __name__ == "__main__":
    asyncio.run(migrate())
