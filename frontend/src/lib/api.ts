import axios from 'axios';
import { ReaderSettings, Category, MangaCategory, ReadingProgress, HistoryEntry } from '../types';

// Create axios instance without baseURL initially
export const api = axios.create();

// Function to set base URL dynamically
export const setApiBaseUrl = (baseUrl: string) => {
    api.defaults.baseURL = `${baseUrl}/api/v1`;
};

// Initialize API base URL from window object (set by desktop-init.ts)
if (typeof window !== 'undefined' && (window as any).__BACKEND_URL__) {
    setApiBaseUrl((window as any).__BACKEND_URL__);
    console.log('[API] Using backend URL:', (window as any).__BACKEND_URL__);
} else {
    // Default fallback
    setApiBaseUrl('http://localhost:8000');
    console.log('[API] Using default backend URL: http://localhost:8000');
}

// Listen for backend-ready event (for desktop app)
if (typeof window !== 'undefined') {
    window.addEventListener('backend-ready', ((event: CustomEvent) => {
        const url = event.detail.url;
        setApiBaseUrl(url);
        console.log('[API] Backend ready, using URL:', url);
    }) as EventListener);
}

// Helper function to get proxy URL for images
export const getProxyUrl = (imageUrl: string, source?: string): string => {
    if (!api.defaults.baseURL) {
        console.warn('API base URL not set');
        return imageUrl;
    }
    const params = new URLSearchParams({ url: imageUrl });
    if (source) {
        params.append('source', source);
    }
    return `${api.defaults.baseURL}/proxy?${params.toString()}`;
};

// Reader settings API endpoints
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

// Categories API
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

// History API
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

// Reading Progress API
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
