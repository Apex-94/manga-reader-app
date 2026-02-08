from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import Manga, LibraryEntry

router = APIRouter()

class LibraryItem(BaseModel):
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    source: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[Manga])
async def get_library(db: Session = Depends(get_session)):
    """
    Get all manga from the library.
    """
    library_entries = db.exec(select(LibraryEntry)).all()
    manga_list = [entry.manga for entry in library_entries]
    return manga_list

@router.post("/", response_model=Manga)
async def add_to_library(item: LibraryItem, db: Session = Depends(get_session)):
    """
    Add a manga to the library.
    """
    # Check if manga already exists
    existing_manga = db.exec(select(Manga).where(Manga.url == item.url)).first()
    
    if existing_manga:
        # Check if already in library
        existing_library_item = db.exec(select(LibraryEntry).where(LibraryEntry.manga_id == existing_manga.id)).first()
        if existing_library_item:
            return existing_manga
        else:
            # Add to library
            library_item = LibraryEntry(
                manga_id=existing_manga.id,
                added_at=datetime.utcnow()
            )
            db.add(library_item)
            db.commit()
            db.refresh(existing_manga)
            return existing_manga
    
    # Create new manga
    manga = Manga(
        title=item.title,
        url=item.url,
        thumbnail_url=item.thumbnail_url,
        source=item.source,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(manga)
    db.flush()  # Get manga id
    
    # Add to library
    library_item = LibraryEntry(
        manga_id=manga.id,
        added_at=datetime.utcnow()
    )
    db.add(library_item)
    db.commit()
    db.refresh(manga)
    
    return manga

@router.delete("/")
async def remove_from_library(url: str, db: Session = Depends(get_session)):
    """
    Remove a manga from the library.
    """
    # Find manga by URL
    manga = db.exec(select(Manga).where(Manga.url == url)).first()
    
    if not manga:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Remove from library
    library_item = db.exec(select(LibraryEntry).where(LibraryEntry.manga_id == manga.id)).first()
    
    if library_item:
        db.delete(library_item)
        db.commit()
    
    return {"message": "Removed"}
