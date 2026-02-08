from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.db import get_db, Manga, Library

router = APIRouter()

class LibraryItem(BaseModel):
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    source: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[LibraryItem])
async def get_library(db: Session = Depends(get_db)):
    """
    Get all manga from the library.
    """
    library_items = db.query(Library).all()
    manga_list = [item.manga for item in library_items]
    return manga_list

@router.post("/", response_model=LibraryItem)
async def add_to_library(item: LibraryItem, db: Session = Depends(get_db)):
    """
    Add a manga to the library.
    """
    # Check if manga already exists
    existing_manga = db.query(Manga).filter(Manga.url == item.url).first()
    
    if existing_manga:
        # Check if already in library
        existing_library_item = db.query(Library).filter(Library.manga_id == existing_manga.id).first()
        if existing_library_item:
            return existing_manga
        else:
            # Add to library
            library_item = Library(
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
    library_item = Library(
        manga_id=manga.id,
        added_at=datetime.utcnow()
    )
    db.add(library_item)
    db.commit()
    db.refresh(manga)
    
    return manga

@router.delete("/")
async def remove_from_library(url: str, db: Session = Depends(get_db)):
    """
    Remove a manga from the library.
    """
    # Find manga by URL
    manga = db.query(Manga).filter(Manga.url == url).first()
    
    if not manga:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Remove from library
    library_item = db.query(Library).filter(Library.manga_id == manga.id).first()
    
    if library_item:
        db.delete(library_item)
        db.commit()
    
    return {"message": "Removed"}
