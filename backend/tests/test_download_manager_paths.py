from pathlib import Path

from app.services.download_manager import DownloadManager


def test_download_path_structure_and_collision(tmp_path: Path):
    manager = DownloadManager()

    chapter_dir = manager._resolve_chapter_dir(
        root=tmp_path,
        manga_title="My Manga: Test?",
        chapter_number=1,
        chapter_title="I am SHY",
        download_id=11,
    )

    assert chapter_dir.as_posix().endswith("my-manga-test/Chapter_001__i-am-shy")

    # Simulate existing content to trigger deterministic suffix
    (chapter_dir / "001.jpg").write_bytes(b"x")

    chapter_dir_2 = manager._resolve_chapter_dir(
        root=tmp_path,
        manga_title="My Manga: Test?",
        chapter_number=1,
        chapter_title="I am SHY",
        download_id=22,
    )
    assert chapter_dir_2.as_posix().endswith("my-manga-test/Chapter_001__i-am-shy__22")
