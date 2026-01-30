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
  author: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  genres: string[];
  description: string;
  coverUrl: string;
  rating: number;
  chapters: Chapter[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export type ViewState = 'HOME' | 'DETAIL' | 'READER';
