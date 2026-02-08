"""
Database migration utilities for the Manga Reader application.
"""

import json
import os
from datetime import datetime
from sqlmodel import Session, select
from app.db.database import init_db, engine
from app.db.models import Manga, LibraryEntry


def init_db():
    """
    Initialize the database and create all tables.
    """
    from app.db.models import SQLModel
    SQLModel.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def migrate_from_json():
    """
    Migrate data from library.json to SQLite database.
    """
    # Check if library.json exists
    if not os.path.exists("library.json"):
        print("No library.json file found, skipping migration")
        return

    # Load existing data from JSON
    try:
        with open("library.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading library.json: {e}")
        return

    # Create session
    session = Session(engine)

    try:
        # Check if we have any existing records to avoid duplicates
        existing = session.exec(select(Manga)).all()
        existing_urls = {m.url for m in existing}

        # Migrate each item
        migrated_count = 0
        for item in data:
            if item["url"] not in existing_urls:
                manga = Manga(
                    title=item["title"],
                    url=item["url"],
                    thumbnail_url=item.get("thumbnail_url"),
                    source=item["source"],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(manga)
                session.flush()  # Get manga id

                # Add to library
                library_item = LibraryEntry(
                    manga_id=manga.id,
                    added_at=datetime.utcnow()
                )
                session.add(library_item)

                existing_urls.add(item["url"])
                migrated_count += 1
                print(f"Migrated: {item['title']}")

        session.commit()
        print(f"Successfully migrated {migrated_count} items from library.json")

        # Backup the JSON file after successful migration
        if migrated_count > 0:
            os.rename("library.json", "library.json.bak")
            print(f"Backed up library.json to library.json.bak")

    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
    finally:
        session.close()


def main():
    """
    Main migration function.
    """
    print("Starting database initialization...")
    init_db()

    print("\nStarting data migration from library.json...")
    migrate_from_json()

    print("\nMigration complete!")


if __name__ == "__main__":
    main()
