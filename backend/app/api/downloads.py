from datetime import datetime
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Chapter, Download, Manga
from app.extensions.loader import registry
from app.services.download_manager import download_manager

router = APIRouter(tags=["downloads"])


class QueueDownloadRequest(BaseModel):
    manga_title: str
    manga_url: str
    source: str
    chapter_number: int
    chapter_url: str
    chapter_title: Optional[str] = None


def _normalize_source_key(raw: str) -> str:
    query_key = (raw or "").strip().lower()
    if not query_key:
        return query_key

    source_ids = {item["id"] for item in registry.list_sources()}
    if query_key in source_ids:
        return query_key

    if ":" not in query_key:
        en_key = f"{query_key}:en"
        if en_key in source_ids:
            return en_key
        for key in source_ids:
            if key.startswith(f"{query_key}:"):
                return key

    return query_key


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
    normalized_source = _normalize_source_key(payload.source)

    manga = db.exec(select(Manga).where(Manga.url == payload.manga_url)).first()
    if not manga:
        manga = Manga(
            title=payload.manga_title,
            url=payload.manga_url,
            source=normalized_source,
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
        source=normalized_source,
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


@router.delete("/{download_id}/files")
async def delete_download_files(download_id: int, db: Session = Depends(get_session)):
    download = db.get(Download, download_id)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")

    await download_manager.cancel(download_id)

    deleted_files = False
    if download.file_path:
        target = Path(download.file_path)
        try:
            if target.exists() and target.is_dir():
                shutil.rmtree(target)
                deleted_files = True
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to delete files: {exc}")

    chapter = db.exec(
        select(Chapter).where(
            Chapter.manga_id == download.manga_id,
            Chapter.chapter_number == download.chapter_number,
        )
    ).first()
    if chapter:
        chapter.is_downloaded = False
        chapter.downloaded_path = None
        chapter.updated_at = datetime.utcnow()
        db.add(chapter)

    db.delete(download)
    db.commit()
    return {"ok": True, "deleted_files": deleted_files}
