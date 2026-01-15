from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from typing import List, Optional

router = APIRouter()

LIBRARY_FILE = "library.json"

class LibraryItem(BaseModel):
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    source: str

def load_library() -> List[LibraryItem]:
    if not os.path.exists(LIBRARY_FILE):
        return []
    try:
        with open(LIBRARY_FILE, "r") as f:
            data = json.load(f)
            return [LibraryItem(**item) for item in data]
    except:
        return []

def save_library(items: List[LibraryItem]):
    with open(LIBRARY_FILE, "w") as f:
        json.dump([item.dict() for item in items], f, indent=2)

@router.get("/", response_model=List[LibraryItem])
async def get_library():
    return load_library()

@router.post("/", response_model=LibraryItem)
async def add_to_library(item: LibraryItem):
    items = load_library()
    # Check duplicates by URL
    for i in items:
        if i.url == item.url:
            return i # Already exists, just return it
    
    items.append(item)
    save_library(items)
    return item

@router.delete("/")
async def remove_from_library(url: str):
    items = load_library()
    new_items = [i for i in items if i.url != url]
    if len(items) == len(new_items):
        raise HTTPException(status_code=404, detail="Item not found")
    
    save_library(new_items)
    return {"message": "Removed"}
