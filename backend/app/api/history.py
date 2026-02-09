from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import History, ReadingProgress, Manga, Chapter

router = APIRouter(tags=["History & Progress"])


@router.get("/")
async def get_reading_history(session: Session = Depends(get_session)):
    """Get all reading history entries sorted by read_at descending"""
    history = session.exec(
        select(History).order_by(History.read_at.desc())
    ).all()
    
    # Enhance history with manga and chapter details
    enhanced_history = []
    for entry in history:
        manga = session.get(Manga, entry.manga_id)
        if manga:
            chapter = session.exec(
                select(Chapter).where(
                    Chapter.manga_id == entry.manga_id,
                    Chapter.chapter_number == entry.chapter_number
                )
            ).first()
            
            enhanced_history.append({
                "id": entry.id,
                "manga_id": entry.manga_id,
                "chapter_number": entry.chapter_number,
                "read_at": entry.read_at,
                "manga": {
                    "id": manga.id,
                    "title": manga.title,
                    "thumbnail_url": manga.thumbnail_url,
                    "source": manga.source
                },
                "chapter": {
                    "id": chapter.id if chapter else None,
                    "title": chapter.title if chapter else None
                }
            })
    
    return {"history": enhanced_history}


@router.get("/manga/{manga_id}")
async def get_manga_history(manga_id: int, session: Session = Depends(get_session)):
    """Get reading history for a specific manga"""
    history = session.exec(
        select(History)
        .where(History.manga_id == manga_id)
        .order_by(History.read_at.desc())
    ).all()
    
    return {"history": history}


@router.post("/")
async def add_history_entry(manga_id: int, chapter_number: int, session: Session = Depends(get_session)):
    """Add a new history entry"""
    # Check if manga exists
    manga = session.get(Manga, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")
    
    history_entry = History(manga_id=manga_id, chapter_number=chapter_number)
    session.add(history_entry)
    session.commit()
    session.refresh(history_entry)
    return {"history": history_entry}


@router.delete("/{history_id}")
async def delete_history_entry(history_id: int, session: Session = Depends(get_session)):
    """Delete a history entry"""
    history = session.get(History, history_id)
    if not history:
        raise HTTPException(status_code=404, detail="History entry not found")
    
    session.delete(history)
    session.commit()
    return {"message": "History entry deleted successfully"}


@router.delete("/manga/{manga_id}")
async def delete_manga_history(manga_id: int, session: Session = Depends(get_session)):
    """Delete all history entries for a specific manga"""
    history_entries = session.exec(
        select(History).where(History.manga_id == manga_id)
    ).all()
    
    for entry in history_entries:
        session.delete(entry)
    
    session.commit()
    return {"message": "Manga history deleted successfully"}


@router.delete("/")
async def clear_history(session: Session = Depends(get_session)):
    """Clear all reading history"""
    history_entries = session.exec(select(History)).all()
    for entry in history_entries:
        session.delete(entry)
    
    session.commit()
    return {"message": "Reading history cleared successfully"}


@router.get("/progress/manga/{manga_id}")
async def get_reading_progress(manga_id: int, session: Session = Depends(get_session)):
    """Get reading progress for a specific manga"""
    progress = session.exec(
        select(ReadingProgress)
        .where(ReadingProgress.manga_id == manga_id)
        .order_by(ReadingProgress.chapter_number)
    ).all()
    
    return {"progress": progress}


@router.get("/progress/manga/{manga_id}/chapter/{chapter_number}")
async def get_chapter_progress(manga_id: int, chapter_number: int, session: Session = Depends(get_session)):
    """Get reading progress for a specific chapter"""
    progress = session.exec(
        select(ReadingProgress)
        .where(
            ReadingProgress.manga_id == manga_id,
            ReadingProgress.chapter_number == chapter_number
        )
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Reading progress not found")
    
    return {"progress": progress}


@router.post("/progress")
async def update_reading_progress(
    manga_id: int,
    chapter_number: int,
    page_number: int = 0,
    session: Session = Depends(get_session)
):
    """Update or create reading progress"""
    # Check if manga exists
    manga = session.get(Manga, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")
    
    # Check if chapter exists
    chapter = session.exec(
        select(Chapter)
        .where(
            Chapter.manga_id == manga_id,
            Chapter.chapter_number == chapter_number
        )
    ).first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Find existing progress or create new
    progress = session.exec(
        select(ReadingProgress)
        .where(
            ReadingProgress.manga_id == manga_id,
            ReadingProgress.chapter_number == chapter_number
        )
    ).first()
    
    if progress:
        progress.page_number = page_number
    else:
        progress = ReadingProgress(
            manga_id=manga_id,
            chapter_number=chapter_number,
            page_number=page_number
        )
        session.add(progress)
    
    session.commit()
    session.refresh(progress)
    return {"progress": progress}
