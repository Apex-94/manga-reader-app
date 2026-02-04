import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, getProxyUrl } from "../../lib/api";
import { BookOpen } from "lucide-react";

interface LibraryItem {
    title: string;
    url: string;
    thumbnail_url?: string;
    source: string;
}

function Card({ key, item, onRemove }: { key?: any, item: LibraryItem, onRemove: (url: string) => void }) {
    return (
        <div className="block rounded-xl overflow-hidden border bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all relative group">
            <Link
                to={`/manga?url=${encodeURIComponent(item.url)}&source=${encodeURIComponent(item.source)}`}
                className="block"
            >
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {item.thumbnail_url && (
                        <img
                            src={getProxyUrl(item.thumbnail_url, item.source)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )}
                </div>
                <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-gray-100 mb-1">
                        {item.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.source}</div>
                </div>
            </Link>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(item.url);
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700 transform translate-y-2 group-hover:translate-y-0"
                title="Remove from Library"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            </button>
        </div>
    );
}

export default function LibraryPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["library"],
        queryFn: async () => {
            const resp = await api.get(`/library`);
            return resp.data as LibraryItem[];
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (url: string) => {
            await api.delete(`/library`, { params: { url } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["library"] });
        }
    });

    return (
        <div className="py-8">
            <h1 className="text-3xl font-bold mb-8">My Library</h1>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {(!data || data.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <BookOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                Star your favorite manga to keep track of them here.
                            </p>
                            <Link to="/browse" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Go to Browse
                            </Link>
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                        {(data || []).map((it) => (
                            <Card key={it.url} item={it} onRemove={(url) => removeMutation.mutate(url)} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}