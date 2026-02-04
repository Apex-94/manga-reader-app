import axios from 'axios';

export const api = axios.create({
    baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1',
});

// Helper function to get proxy URL for images
export const getProxyUrl = (imageUrl: string, source?: string): string => {
    const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
    const params = new URLSearchParams({ url: imageUrl });
    if (source) {
        params.append('source', source);
    }
    return `${baseUrl}/proxy?${params.toString()}`;
};