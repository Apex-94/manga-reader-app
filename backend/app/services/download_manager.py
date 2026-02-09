import asyncio
import os
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import httpx
from sqlmodel import Session, select

from app.db.database import engine
from app.db.models import Chapter, Download, Manga
from app.extensions.loader import registry


class DownloadManager:
    def __init__(self) -> None:
        self.queue: asyncio.Queue[int] = asyncio.Queue()
        self.running = False
        self.worker_task: Optional[asyncio.Task] = None
        self.active_downloads: dict[int, asyncio.Task] = {}
        self.paused_ids: set[int] = set()
        self.data_dir = Path(os.getenv("DATA_DIR", "./data"))
        self.download_root = self.data_dir / "downloads"
        self.download_root.mkdir(parents=True, exist_ok=True)

    async def start(self) -> None:
        if self.running:
            return
        self.running = True
        self.worker_task = asyncio.create_task(self._worker())

    async def stop(self) -> None:
        self.running = False
        if self.worker_task:
            self.worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.worker_task
        for _, task in list(self.active_downloads.items()):
            task.cancel()

    async def enqueue(self, download_id: int) -> None:
        await self.queue.put(download_id)

    async def pause(self, download_id: int) -> None:
        self.paused_ids.add(download_id)
        with Session(engine) as db:
            dl = db.get(Download, download_id)
            if dl:
                dl.status = "paused"
                dl.updated_at = datetime.utcnow()
                db.add(dl)
                db.commit()

    async def resume(self, download_id: int) -> None:
        self.paused_ids.discard(download_id)
        with Session(engine) as db:
            dl = db.get(Download, download_id)
            if dl:
                dl.status = "pending"
                dl.updated_at = datetime.utcnow()
                db.add(dl)
                db.commit()
        await self.queue.put(download_id)

    async def cancel(self, download_id: int) -> None:
        self.paused_ids.discard(download_id)
        task = self.active_downloads.pop(download_id, None)
        if task:
            task.cancel()
        with Session(engine) as db:
            dl = db.get(Download, download_id)
            if dl:
                dl.status = "cancelled"
                dl.updated_at = datetime.utcnow()
                db.add(dl)
                db.commit()

    async def _worker(self) -> None:
        while self.running:
            download_id = await self.queue.get()
            if download_id in self.paused_ids:
                continue
            task = asyncio.create_task(self._run_download(download_id))
            self.active_downloads[download_id] = task
            try:
                await task
            finally:
                self.active_downloads.pop(download_id, None)
                self.queue.task_done()

    async def _run_download(self, download_id: int) -> None:
        with Session(engine) as db:
            download = db.get(Download, download_id)
            if not download:
                return
            if download.status in {"completed", "cancelled"}:
                return
            if not download.chapter_url or not download.source:
                download.status = "failed"
                download.error = "Missing chapter_url or source"
                download.updated_at = datetime.utcnow()
                db.add(download)
                db.commit()
                return
            download.status = "downloading"
            download.error = None
            download.updated_at = datetime.utcnow()
            db.add(download)
            db.commit()

        try:
            scraper = registry.get(download.source.lower())
            pages = await scraper.pages(download.chapter_url)
            if not pages:
                raise RuntimeError("No pages returned by source")

            with Session(engine) as db:
                download = db.get(Download, download_id)
                if not download:
                    return
                download.total_pages = len(pages)
                db.add(download)
                db.commit()

            chapter_dir = self.download_root / f"manga_{download.manga_id}" / f"chapter_{download.chapter_number}"
            chapter_dir.mkdir(parents=True, exist_ok=True)

            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                for idx, page_url in enumerate(pages, start=1):
                    with Session(engine) as db:
                        current = db.get(Download, download_id)
                        if not current or current.status == "cancelled":
                            return
                        if download_id in self.paused_ids:
                            current.status = "paused"
                            current.updated_at = datetime.utcnow()
                            db.add(current)
                            db.commit()
                            return

                    resolved = await scraper.resolve_image(page_url)
                    response = await client.get(resolved)
                    response.raise_for_status()
                    ext = _detect_ext(resolved, response.headers.get("content-type"))
                    out_file = chapter_dir / f"{idx:03d}.{ext}"
                    out_file.write_bytes(response.content)

                    with Session(engine) as db:
                        current = db.get(Download, download_id)
                        if not current:
                            return
                        current.downloaded_pages = idx
                        current.progress = idx / len(pages)
                        current.file_path = str(chapter_dir)
                        current.updated_at = datetime.utcnow()
                        db.add(current)
                        db.commit()

            with Session(engine) as db:
                current = db.get(Download, download_id)
                if not current:
                    return
                current.status = "completed"
                current.progress = 1.0
                current.updated_at = datetime.utcnow()
                db.add(current)

                chapter = db.exec(
                    select(Chapter).where(
                        Chapter.manga_id == current.manga_id,
                        Chapter.chapter_number == current.chapter_number,
                    )
                ).first()
                if chapter:
                    chapter.is_downloaded = True
                    chapter.downloaded_path = current.file_path
                    chapter.updated_at = datetime.utcnow()
                    db.add(chapter)
                db.commit()
        except Exception as exc:
            with Session(engine) as db:
                current = db.get(Download, download_id)
                if current:
                    current.status = "failed"
                    current.error = str(exc)
                    current.updated_at = datetime.utcnow()
                    db.add(current)
                    db.commit()


def _detect_ext(url: str, content_type: Optional[str]) -> str:
    parsed = urlparse(url)
    ext = Path(parsed.path).suffix.lower().replace(".", "")
    if ext in {"jpg", "jpeg", "png", "webp", "gif"}:
        return "jpg" if ext == "jpeg" else ext
    if content_type:
        if "png" in content_type:
            return "png"
        if "webp" in content_type:
            return "webp"
        if "gif" in content_type:
            return "gif"
    return "jpg"


import contextlib

download_manager = DownloadManager()
