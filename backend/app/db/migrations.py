"""
Database migration utilities for the Manga Reader application.
"""

import json
import os
from datetime import datetime
from app.db import Base, engine, SessionLocal, Manga, Library


def init_db():
    """
    Initialize the database and create all tables.
    """
    Base.metadata.create_all(bind=engine)
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
    db = SessionLocal()

    try:
        # Check if we have any existing records to avoid duplicates
        existing_manga = db.query(Manga).all()
        existing_urls = {m.url for m in existing_manga}

        # Migrate each item
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
                db.add(manga)
                db.flush()  # Get manga id

                # Add to library
                library_item = Library(
                    manga_id=manga.id,
                    added_at=datetime.utcnow()
                )
                db.add(library_item)

                existing_urls.add(item["url"])
                print(f"Migrated: {item['title']}")

        db.commit()
        print(f"Successfully migrated {len(data)} items from library.json")

    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
    finally:
        db.close()


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
