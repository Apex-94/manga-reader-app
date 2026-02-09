from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Download, Manga
from app.services.download_manager import download_manager

router = APIRouter(tags=["downloads"])


class QueueDownloadRequest(BaseModel):
    manga_title: str
    manga_url: str
    source: str
    chapter_number: int
    chapter_url: str
    chapter_title: Optional[str] = None


@router.get("")
async def list_downloads(db: Session = Depends(get_session)):
    downloads = db.exec(select(Download).order_by(Download.created_at.desc())).all()
    items = []
    for dl in downloads:
        manga = db.get(Manga, dl.manga_id)
        items.append(
            {
                "id": dl.id,
                "manga_id": dl.manga_id,
                "manga_title": manga.title if manga else "Unknown",
                "chapter_number": dl.chapter_number,
                "chapter_title": dl.chapter_title,
                "chapter_url": dl.chapter_url,
                "source": dl.source,
                "status": dl.status,
                "progress": dl.progress,
                "error": dl.error,
                "file_path": dl.file_path,
                "total_pages": dl.total_pages,
                "downloaded_pages": dl.downloaded_pages,
                "created_at": dl.created_at,
                "updated_at": dl.updated_at,
            }
        )
    return {"downloads": items}


@router.post("/queue")
async def queue_download(payload: QueueDownloadRequest, db: Session = Depends(get_session)):
    manga = db.exec(select(Manga).where(Manga.url == payload.manga_url)).first()
    if not manga:
        manga = Manga(
            title=payload.manga_title,
            url=payload.manga_url,
            source=payload.source,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(manga)
        db.flush()

    existing = db.exec(
        select(Download).where(
            Download.manga_id == manga.id,
            Download.chapter_number == payload.chapter_number,
            Download.status.in_(["pending", "downloading", "paused"]),
        )
    ).first()
    if existing:
        return {"ok": True, "download_id": existing.id, "message": "Already queued"}

    download = Download(
        manga_id=manga.id,
        chapter_number=payload.chapter_number,
        chapter_url=payload.chapter_url,
        chapter_title=payload.chapter_title,
        source=payload.source,
        status="pending",
        progress=0.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(download)
    db.commit()
    db.refresh(download)
    await download_manager.enqueue(download.id)
    return {"ok": True, "download_id": download.id}


@router.post("/{download_id}/pause")
async def pause_download(download_id: int, db: Session = Depends(get_session)):
    download = db.get(Download, download_id)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    await download_manager.pause(download_id)
    return {"ok": True}


@router.post("/{download_id}/resume")
async def resume_download(download_id: int, db: Session = Depends(get_session)):
    download = db.get(Download, download_id)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    await download_manager.resume(download_id)
    return {"ok": True}


@router.post("/{download_id}/cancel")
async def cancel_download(download_id: int, db: Session = Depends(get_session)):
    download = db.get(Download, download_id)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    await download_manager.cancel(download_id)
    return {"ok": True}
