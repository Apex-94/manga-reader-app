import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from threading import RLock
from time import time
from typing import Optional


@dataclass
class CachedImage:
    content: bytes
    content_type: str


class DiskImageCache:
    """Simple disk-backed image cache with TTL + LRU eviction."""

    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()

    def _cache_key(self, url: str, source: Optional[str]) -> str:
        normalized = f"{(source or '').strip().lower()}:{url.strip()}"
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    def _paths_for_key(self, key: str) -> tuple[Path, Path]:
        return self.cache_dir / f"{key}.bin", self.cache_dir / f"{key}.json"

    def get(self, url: str, source: Optional[str], ttl_hours: int) -> Optional[CachedImage]:
        if ttl_hours <= 0:
            return None

        key = self._cache_key(url, source)
        data_path, meta_path = self._paths_for_key(key)

        with self._lock:
            if not data_path.exists() or not meta_path.exists():
                return None

            try:
                metadata = json.loads(meta_path.read_text(encoding="utf-8"))
                created_at = float(metadata.get("created_at", 0))
                if created_at <= 0:
                    self._delete_entry(data_path, meta_path)
                    return None

                ttl_seconds = ttl_hours * 3600
                now = time()
                if now - created_at > ttl_seconds:
                    self._delete_entry(data_path, meta_path)
                    return None

                content = data_path.read_bytes()
                metadata["last_accessed"] = now
                metadata["size"] = len(content)
                meta_path.write_text(json.dumps(metadata), encoding="utf-8")
                return CachedImage(
                    content=content,
                    content_type=str(metadata.get("content_type") or "image/jpeg"),
                )
            except Exception:
                self._delete_entry(data_path, meta_path)
                return None

    def put(
        self,
        *,
        url: str,
        source: Optional[str],
        content: bytes,
        content_type: Optional[str],
        max_bytes: int,
        ttl_hours: int,
    ) -> None:
        if max_bytes <= 0 or ttl_hours <= 0:
            return

        if len(content) > max_bytes:
            return

        key = self._cache_key(url, source)
        data_path, meta_path = self._paths_for_key(key)
        now = time()
        metadata = {
            "url": url,
            "source": source,
            "created_at": now,
            "last_accessed": now,
            "content_type": content_type or "image/jpeg",
            "size": len(content),
        }

        with self._lock:
            data_path.write_bytes(content)
            meta_path.write_text(json.dumps(metadata), encoding="utf-8")
            self.evict(max_bytes=max_bytes, ttl_hours=ttl_hours)

    def evict(self, *, max_bytes: int, ttl_hours: int) -> None:
        with self._lock:
            now = time()
            ttl_seconds = max(ttl_hours, 0) * 3600
            entries: list[tuple[Path, Path, dict]] = []

            for meta_path in self.cache_dir.glob("*.json"):
                data_path = self.cache_dir / f"{meta_path.stem}.bin"
                if not data_path.exists():
                    self._delete_entry(data_path, meta_path)
                    continue

                try:
                    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
                except Exception:
                    self._delete_entry(data_path, meta_path)
                    continue

                created_at = float(metadata.get("created_at", 0))
                if created_at <= 0:
                    self._delete_entry(data_path, meta_path)
                    continue

                if ttl_seconds > 0 and now - created_at > ttl_seconds:
                    self._delete_entry(data_path, meta_path)
                    continue

                size = data_path.stat().st_size
                metadata["size"] = size
                entries.append((data_path, meta_path, metadata))

            if max_bytes <= 0:
                for data_path, meta_path, _ in entries:
                    self._delete_entry(data_path, meta_path)
                return

            total_size = sum(int(item[2].get("size", 0)) for item in entries)
            if total_size <= max_bytes:
                return

            entries.sort(key=lambda item: float(item[2].get("last_accessed", item[2].get("created_at", 0))))
            for data_path, meta_path, metadata in entries:
                if total_size <= max_bytes:
                    break
                total_size -= int(metadata.get("size", 0))
                self._delete_entry(data_path, meta_path)

    def _delete_entry(self, data_path: Path, meta_path: Path) -> None:
        for path in (data_path, meta_path):
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass


def build_default_cache_dir() -> Path:
    data_dir = Path(os.getenv("DATA_DIR", "./data"))
    return data_dir / "image-cache"
