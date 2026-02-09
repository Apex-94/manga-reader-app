from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Chapter, LibraryEntry, Manga
from app.extensions.loader import registry

router = APIRouter(tags=["updates"])


def _chapter_number(raw_number: Optional[float], index: int) -> int:
    if raw_number is None:
        return index
    try:
        return int(raw_number)
    except (TypeError, ValueError):
        return index


@router.get("")
async def list_updates(limit: int = 50, db: Session = Depends(get_session)):
    rows = db.exec(select(Chapter).order_by(Chapter.created_at.desc()).limit(limit)).all()
    items = []
    for chapter in rows:
        manga = db.get(Manga, chapter.manga_id)
        if not manga:
            continue
        items.append(
            {
                "id": chapter.id,
                "manga_id": chapter.manga_id,
                "manga_title": manga.title,
                "manga_url": manga.url,
                "source": manga.source,
                "chapter_number": chapter.chapter_number,
                "chapter_title": chapter.title,
                "chapter_url": chapter.url,
                "is_read": chapter.is_read,
                "is_downloaded": chapter.is_downloaded,
                "created_at": chapter.created_at,
            }
        )
    return {"updates": items}


@router.post("/check")
async def check_library_updates(db: Session = Depends(get_session)):
    library_entries = db.exec(select(LibraryEntry)).all()
    total_new = 0
    by_manga: list[dict] = []

    for entry in library_entries:
        manga = db.get(Manga, entry.manga_id)
        if not manga:
            continue
        try:
            scraper = registry.get(manga.source.lower())
        except KeyError:
            continue

        try:
            chapters = await scraper.chapters(manga.url)
        except Exception:
            continue

        new_for_this = 0
        for idx, chapter in enumerate(chapters, start=1):
            existing = db.exec(select(Chapter).where(Chapter.url == chapter.url)).first()
            if existing:
                continue
            chapter_number = _chapter_number(chapter.chapter_number, idx)
            db_chapter = Chapter(
                manga_id=manga.id,
                chapter_number=chapter_number,
                title=chapter.title,
                url=chapter.url,
                is_read=False,
                is_downloaded=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(db_chapter)
            new_for_this += 1
            total_new += 1
        if new_for_this:
            by_manga.append(
                {
                    "manga_id": manga.id,
                    "manga_title": manga.title,
                    "new_chapters": new_for_this,
                }
            )
    db.commit()
    return {"ok": True, "new_chapters": total_new, "by_manga": by_manga}


@router.post("/mark-read/{chapter_id}")
async def mark_update_read(chapter_id: int, db: Session = Depends(get_session)):
    chapter = db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    chapter.is_read = True
    chapter.updated_at = datetime.utcnow()
    db.add(chapter)
    db.commit()
    return {"ok": True}
