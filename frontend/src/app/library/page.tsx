"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link"; // Correct import for Next.js Link

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});

export const dynamic = "force-dynamic";

interface LibraryItem {
    title: string;
    url: string;
    thumbnail_url?: string;
    source: string;
}

function Card({ item, onRemove }: { item: LibraryItem, onRemove: (url: string) => void }) {
    return (
        <div className="block rounded-xl overflow-hidden border bg-white dark:bg-gray-800 hover:shadow relative group">
            <Link
                href={`/manga?url=${encodeURIComponent(item.url)}`}
                className="block"
            >
                <div className="aspect-[3/4] bg-gray-200">
                    {item.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="p-3 text-sm font-medium line-clamp-2">
                    {item.title}
                </div>
                <div className="px-3 pb-3 text-xs text-gray-500">{item.source}</div>
            </Link>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(item.url);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
        <div className="py-6">
            <h1 className="text-2xl font-semibold mb-4">My Library</h1>

            {isLoading ? (
                <p>Loading library...</p>
            ) : (
                <>
                    {(!data || data.length === 0) && (
                        <p className="text-gray-500">Your library is empty. Go to Browse to add manga!</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                        {(data || []).map((it) => (
                            <Card key={it.url} item={it} onRemove={(url) => removeMutation.mutate(url)} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
