from pathlib import Path

from app.services.image_cache import DiskImageCache


def test_image_cache_hit_and_ttl_eviction(tmp_path: Path):
    cache = DiskImageCache(tmp_path)
    content = b"abc123"

    cache.put(
        url="https://example.com/c1.jpg",
        source="mangahere:en",
        content=content,
        content_type="image/jpeg",
        max_bytes=1024,
        ttl_hours=1,
    )

    cached = cache.get(url="https://example.com/c1.jpg", source="mangahere:en", ttl_hours=1)
    assert cached is not None
    assert cached.content == content
    assert cached.content_type == "image/jpeg"

    # TTL = 0 means disabled / expired semantics for reads
    expired = cache.get(url="https://example.com/c1.jpg", source="mangahere:en", ttl_hours=0)
    assert expired is None


def test_image_cache_lru_size_eviction(tmp_path: Path):
    cache = DiskImageCache(tmp_path)

    cache.put(
        url="https://example.com/a.jpg",
        source="s",
        content=b"a" * 8,
        content_type="image/jpeg",
        max_bytes=32,
        ttl_hours=24,
    )
    cache.put(
        url="https://example.com/b.jpg",
        source="s",
        content=b"b" * 8,
        content_type="image/jpeg",
        max_bytes=32,
        ttl_hours=24,
    )

    # Touch b so a becomes least recently used
    assert cache.get(url="https://example.com/b.jpg", source="s", ttl_hours=24) is not None

    # Insert large-enough entry to trigger eviction
    cache.put(
        url="https://example.com/c.jpg",
        source="s",
        content=b"c" * 20,
        content_type="image/jpeg",
        max_bytes=32,
        ttl_hours=24,
    )

    assert cache.get(url="https://example.com/a.jpg", source="s", ttl_hours=24) is None
    assert cache.get(url="https://example.com/b.jpg", source="s", ttl_hours=24) is not None
    assert cache.get(url="https://example.com/c.jpg", source="s", ttl_hours=24) is not None
