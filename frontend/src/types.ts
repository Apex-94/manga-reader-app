export interface Chapter {
  id: string;
  number: number;
  title: string;
  date: string;
  pages: string[];
}

export interface Manga {
  id: string;
  title: string;
  altTitle: string;
  author: string | null;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  genres: string[];
  description: string;
  coverUrl: string;
  rating: number;
  chapters: Chapter[];
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface MangaCategory {
  manga_id: number;
  category_id: number;
}

export interface ReadingProgress {
  id: number;
  manga_id: number;
  chapter_number: number;
  page_number: number;
  updated_at: string;
}

export interface HistoryEntry {
  id: number;
  manga_id: number;
  chapter_number: number;
  read_at: string;
  manga?: {
    id: number;
    title: string;
    thumbnail_url: string | null;
    source: string;
  };
  chapter?: {
    id: number;
    title: string;
  };
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface MangaCategory {
  manga_id: number;
  category_id: number;
}

export interface ReadingProgress {
  id: number;
  manga_id: number;
  chapter_number: number;
  page_number: number;
  updated_at: string;
}

export interface HistoryEntry {
  id: number;
  manga_id: number;
  chapter_number: number;
  read_at: string;
  manga?: {
    id: number;
    title: string;
    thumbnail_url: string | null;
    source: string;
  };
  chapter?: {
    id: number;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export type ViewState = 'HOME' | 'DETAIL' | 'READER';

export type ReadingMode = 'VERTICAL' | 'SINGLE' | 'DOUBLE';

export type ZoomMode = 'FIT_WIDTH' | 'FIT_HEIGHT' | 'CUSTOM';

export interface ReaderSettings {
  readingMode: ReadingMode;
  zoomMode: ZoomMode;
  customZoom: number;
  autoScroll: boolean;
  scrollSpeed: number;
  showPageNumbers: boolean;
  showProgress: boolean;
}
