from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Manga(Base):
    """
    Model representing a manga in the library.
    """
    __tablename__ = "manga"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    thumbnail_url = Column(String, nullable=True)
    source = Column(String)
    description = Column(String, nullable=True)
    author = Column(String, nullable=True)
    artist = Column(String, nullable=True)
    genres = Column(String, nullable=True)  # Comma-separated string of genres
    status = Column(String, nullable=True)
    last_read_chapter = Column(Integer, default=0)
    last_read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chapters = relationship("Chapter", back_populates="manga")


class Chapter(Base):
    """
    Model representing a chapter of a manga.
    """
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    manga_id = Column(Integer, ForeignKey("manga.id"))
    chapter_number = Column(Integer)
    title = Column(String, nullable=True)
    url = Column(String, unique=True, index=True)
    is_read = Column(Boolean, default=False)
    is_downloaded = Column(Boolean, default=False)
    downloaded_path = Column(String, nullable=True)
    release_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    manga = relationship("Manga", back_populates="chapters")


class Library(Base):
    """
    Model representing the user's library.
    This is a many-to-many relationship table between users and manga.
    For simplicity, we assume a single user for now.
    """
    __tablename__ = "library"

    id = Column(Integer, primary_key=True, index=True)
    manga_id = Column(Integer, ForeignKey("manga.id"), unique=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    manga = relationship("Manga")
