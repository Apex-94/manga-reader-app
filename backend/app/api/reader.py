"""
API routes for managing reader settings and preferences.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ReaderSettings(BaseModel):
    readingMode: str = "VERTICAL"
    zoomMode: str = "FIT_WIDTH"
    customZoom: int = 100
    autoScroll: bool = False
    scrollSpeed: int = 50
    showPageNumbers: bool = True
    showProgress: bool = True

# In-memory storage for demo purposes
# In a real application, this should use a database or persistent storage
reader_settings_storage = {}

@router.get("/settings/{user_id}")
async def get_reader_settings(user_id: str):
    """
    Retrieve reader settings for a specific user.
    """
    if user_id not in reader_settings_storage:
        return ReaderSettings()
    return reader_settings_storage[user_id]

@router.put("/settings/{user_id}")
async def update_reader_settings(user_id: str, settings: ReaderSettings):
    """
    Update and store reader settings for a specific user.
    """
    reader_settings_storage[user_id] = settings
    return {"message": "Reader settings updated successfully", "settings": settings}

@router.post("/settings/{user_id}")
async def create_reader_settings(user_id: str, settings: Optional[ReaderSettings] = None):
    """
    Create or initialize reader settings for a specific user.
    """
    if user_id in reader_settings_storage:
        raise HTTPException(status_code=409, detail="Reader settings already exist for this user")
    
    new_settings = settings or ReaderSettings()
    reader_settings_storage[user_id] = new_settings
    return {"message": "Reader settings created successfully", "settings": new_settings}

@router.delete("/settings/{user_id}")
async def delete_reader_settings(user_id: str):
    """
    Delete reader settings for a specific user.
    """
    if user_id not in reader_settings_storage:
        raise HTTPException(status_code=404, detail="Reader settings not found")
    
    del reader_settings_storage[user_id]
    return {"message": "Reader settings deleted successfully"}