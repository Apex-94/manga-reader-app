import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LibraryAddResponse } from '../types';

export interface LibraryMangaRecord {
  id: number;
  title: string;
  url: string;
  thumbnail_url?: string | null;
  source: string;
}

export const LIBRARY_QUERY_KEY = ['library'] as const;

export const toLibraryKey = (url: string) => url.trim();

export function useLibraryState() {
  const queryClient = useQueryClient();

  const libraryQuery = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: async () => {
      const resp = await api.get('/library/');
      return resp.data as LibraryMangaRecord[];
    },
  });

  const libraryMap = useMemo(() => {
    const map = new Map<string, LibraryMangaRecord>();
    for (const manga of libraryQuery.data || []) {
      map.set(toLibraryKey(manga.url), manga);
    }
    return map;
  }, [libraryQuery.data]);

  const isInLibrary = (url: string) => libraryMap.has(toLibraryKey(url));
  const getLibraryManga = (url: string) => libraryMap.get(toLibraryKey(url));

  const applyAddResult = (result: LibraryAddResponse) => {
    queryClient.setQueryData(LIBRARY_QUERY_KEY, (prev: LibraryMangaRecord[] | undefined) => {
      const current = prev || [];
      const key = toLibraryKey(result.manga.url);
      const exists = current.some((item) => toLibraryKey(item.url) === key);
      if (exists) return current;
      return [...current, result.manga];
    });
  };

  const removeByUrl = (url: string) => {
    queryClient.setQueryData(LIBRARY_QUERY_KEY, (prev: LibraryMangaRecord[] | undefined) => {
      const current = prev || [];
      const key = toLibraryKey(url);
      return current.filter((item) => toLibraryKey(item.url) !== key);
    });
  };

  return {
    libraryQuery,
    libraryMap,
    isInLibrary,
    getLibraryManga,
    applyAddResult,
    removeByUrl,
  };
}
