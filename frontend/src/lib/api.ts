import axios from 'axios';
import {
    ReaderSettings,
    Category,
    MangaCategory,
    ReadingProgress,
    HistoryEntry,
    DownloadItem,
    UpdateItem,
    LibraryAddResponse,
} from '../types';

export const api = axios.create();

export const setApiBaseUrl = (baseUrl: string) => {
    api.defaults.baseURL = `${baseUrl}/api/v1`;
    console.log('[API] Base URL set to:', api.defaults.baseURL);
};

const getDefaultBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:8000';
    }
    if (window.__BACKEND_URL__) {
        return window.__BACKEND_URL__;
    }
    return (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
};

const normalizeBaseUrl = (url: string): string => {
    return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
};

if (typeof window !== 'undefined') {
    const initialBaseUrl = normalizeBaseUrl(getDefaultBaseUrl());
    setApiBaseUrl(initialBaseUrl);

    window.addEventListener('backend-ready', ((event: CustomEvent<{ url?: string }>) => {
        if (!event.detail?.url) {
            return;
        }
        setApiBaseUrl(normalizeBaseUrl(event.detail.url));
    }) as EventListener);
}

export async function waitForBackend(): Promise<void> {
    return Promise.resolve();
}

export const getProxyUrl = (imageUrl: string, source?: string): string => {
    if (!api.defaults.baseURL) {
        return imageUrl;
    }
    const params = new URLSearchParams({ url: imageUrl, cache: '1' });
    if (source) {
        params.append('source', source);
    }
    return `${api.defaults.baseURL}/proxy?${params.toString()}`;
};

export const getReaderSettings = async (userId: string): Promise<ReaderSettings> => {
    const response = await api.get(`/reader/settings/${userId}`);
    return response.data;
};

export const updateReaderSettings = async (userId: string, settings: ReaderSettings): Promise<ReaderSettings> => {
    const response = await api.put(`/reader/settings/${userId}`, settings);
    return response.data.settings;
};

export const createReaderSettings = async (userId: string, settings?: ReaderSettings): Promise<ReaderSettings> => {
    const response = await api.post(`/reader/settings/${userId}`, settings);
    return response.data.settings;
};

export const deleteReaderSettings = async (userId: string): Promise<void> => {
    await api.delete(`/reader/settings/${userId}`);
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.categories;
};

export const createCategory = async (name: string): Promise<Category> => {
    const response = await api.post('/categories', null, {
        params: { name }
    });
    return response.data.category;
};

export const updateCategory = async (id: number, name: string): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, null, {
        params: { name }
    });
    return response.data.category;
};

export const deleteCategory = async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
};

export const getCategoryManga = async (id: number): Promise<any[]> => {
    const response = await api.get(`/categories/${id}/manga`);
    return response.data.manga;
};

export const addMangaToCategory = async (categoryId: number, mangaId: number): Promise<MangaCategory> => {
    const response = await api.post(`/categories/${categoryId}/manga/${mangaId}`);
    return response.data.manga_category;
};

export const removeMangaFromCategory = async (categoryId: number, mangaId: number): Promise<void> => {
    await api.delete(`/categories/${categoryId}/manga/${mangaId}`);
};

export const addToLibrary = async (payload: {
    title: string;
    url: string;
    thumbnail_url?: string;
    source: string;
}): Promise<LibraryAddResponse> => {
    const response = await api.post('/library', payload);
    return response.data;
};

export const getReadingHistory = async (): Promise<HistoryEntry[]> => {
    const response = await api.get('/history');
    return response.data.history;
};

export const getMangaHistory = async (mangaId: number): Promise<HistoryEntry[]> => {
    const response = await api.get(`/history/manga/${mangaId}`);
    return response.data.history;
};

export const addHistoryEntry = async (mangaId: number, chapterNumber: number): Promise<HistoryEntry> => {
    const response = await api.post('/history', null, {
        params: { manga_id: mangaId, chapter_number: chapterNumber }
    });
    return response.data.history;
};

export const deleteHistoryEntry = async (historyId: number): Promise<void> => {
    await api.delete(`/history/${historyId}`);
};

export const deleteMangaHistory = async (mangaId: number): Promise<void> => {
    await api.delete(`/history/manga/${mangaId}`);
};

export const clearHistory = async (): Promise<void> => {
    await api.delete('/history');
};

export const getReadingProgress = async (mangaId: number): Promise<ReadingProgress[]> => {
    const response = await api.get(`/history/progress/manga/${mangaId}`);
    return response.data.progress;
};

export const getChapterProgress = async (mangaId: number, chapterNumber: number): Promise<ReadingProgress> => {
    const response = await api.get(`/history/progress/manga/${mangaId}/chapter/${chapterNumber}`);
    return response.data.progress;
};

export const updateReadingProgress = async (mangaId: number, chapterNumber: number, pageNumber: number): Promise<ReadingProgress> => {
    const response = await api.post('/history/progress', null, {
        params: { manga_id: mangaId, chapter_number: chapterNumber, page_number: pageNumber }
    });
    return response.data.progress;
};

export const queueDownload = async (payload: {
    manga_title: string;
    manga_url: string;
    source: string;
    chapter_number: number;
    chapter_url: string;
    chapter_title?: string;
}) => {
    const response = await api.post('/downloads/queue', payload);
    return response.data;
};

export const getDownloads = async (): Promise<DownloadItem[]> => {
    const response = await api.get('/downloads');
    return response.data.downloads;
};

export const pauseDownload = async (downloadId: number) => {
    await api.post(`/downloads/${downloadId}/pause`);
};

export const resumeDownload = async (downloadId: number) => {
    await api.post(`/downloads/${downloadId}/resume`);
};

export const cancelDownload = async (downloadId: number) => {
    await api.post(`/downloads/${downloadId}/cancel`);
};

export const deleteDownloadFiles = async (downloadId: number) => {
    await api.delete(`/downloads/${downloadId}/files`);
};

export const checkUpdates = async () => {
    const response = await api.post('/updates/check');
    return response.data;
};

export const getUpdates = async (): Promise<UpdateItem[]> => {
    const response = await api.get('/updates');
    return response.data.updates;
};

export const markUpdateRead = async (chapterId: number) => {
    await api.post(`/updates/mark-read/${chapterId}`);
};

export const getAppSettings = async (): Promise<Record<string, unknown>> => {
    const response = await api.get('/settings');
    return response.data.settings;
};

export const updateAppSetting = async (key: string, value: unknown) => {
    await api.put('/settings', { key, value });
};
