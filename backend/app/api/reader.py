"""
API routes for managing reader settings and preferences.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Setting

router = APIRouter()


class ReaderSettings(BaseModel):
    readingMode: str = "VERTICAL"
    zoomMode: str = "FIT_WIDTH"
    customZoom: int = 100
    autoScroll: bool = False
    scrollSpeed: int = 50
    showPageNumbers: bool = True
    showProgress: bool = True


def _key(user_id: str) -> str:
    return f"reader.settings:{user_id}"


@router.get("/settings/{user_id}")
async def get_reader_settings(user_id: str, session: Session = Depends(get_session)):
    row = session.exec(select(Setting).where(Setting.key == _key(user_id))).first()
    if not row:
        return ReaderSettings()
    try:
        return ReaderSettings(**json.loads(row.value))
    except Exception:
        return ReaderSettings()


@router.put("/settings/{user_id}")
async def update_reader_settings(user_id: str, settings: ReaderSettings, session: Session = Depends(get_session)):
    row = session.exec(select(Setting).where(Setting.key == _key(user_id))).first()
    payload = settings.model_dump_json()
    if row:
        row.value = payload
        session.add(row)
    else:
        session.add(Setting(key=_key(user_id), value=payload))
    session.commit()
    return {"message": "Reader settings updated successfully", "settings": settings}


@router.post("/settings/{user_id}")
async def create_reader_settings(
    user_id: str,
    settings: Optional[ReaderSettings] = None,
    session: Session = Depends(get_session),
):
    row = session.exec(select(Setting).where(Setting.key == _key(user_id))).first()
    if row:
        raise HTTPException(status_code=409, detail="Reader settings already exist for this user")

    new_settings = settings or ReaderSettings()
    session.add(Setting(key=_key(user_id), value=new_settings.model_dump_json()))
    session.commit()
    return {"message": "Reader settings created successfully", "settings": new_settings}


@router.delete("/settings/{user_id}")
async def delete_reader_settings(user_id: str, session: Session = Depends(get_session)):
    row = session.exec(select(Setting).where(Setting.key == _key(user_id))).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reader settings not found")

    session.delete(row)
    session.commit()
    return {"message": "Reader settings deleted successfully"}
