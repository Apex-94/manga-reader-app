"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});

interface MangaDetails {
    title: string;
    description: string;
    author: string | null;
    artist: string | null;
    status: string;
    genres: string[];
    thumbnail_url: string | null;
    source_url: string;
}

interface Chapter {
    title: string;
    url: string;
    chapter_number: number | null;
}

function MangaContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");

    const { data: details, isLoading: loadingDetails } = useQuery({
        queryKey: ["manga", url],
        queryFn: async () => {
            if (!url) return null;
            const resp = await api.get(`/manga/details`, { params: { url } });
            return resp.data as MangaDetails;
        },
        enabled: !!url,
    });

    const { data: chapters, isLoading: loadingChapters } = useQuery({
        queryKey: ["chapters", url],
        queryFn: async () => {
            if (!url) return [];
            const resp = await api.get(`/manga/chapters`, { params: { url } });
            return resp.data.chapters as Chapter[];
        },
        enabled: !!url,
    });

    if (!url) return <div className="p-6">No manga URL provided.</div>;
    if (loadingDetails) return <div className="p-6">Loading details...</div>;
    if (!details) return <div className="p-6">Failed to load details.</div>;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden shadow-md">
                        {details.thumbnail_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={details.thumbnail_url}
                                alt={details.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{details.title}</h1>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {details.genres.map((g) => (
                            <span key={g} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                {g}
                            </span>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                            <span className="font-semibold text-gray-500">Author:</span> {details.author || "Unknown"}
                        </div>
                        <div>
                            <span className="font-semibold text-gray-500">Artist:</span> {details.artist || "Unknown"}
                        </div>
                        <div>
                            <span className="font-semibold text-gray-500">Status:</span> {details.status}
                        </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                        {details.description}
                    </p>
                </div>
            </div>

            <div className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Chapters</h2>
                {loadingChapters ? (
                    <p>Loading chapters...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {chapters?.slice().reverse().map((ch) => (
                            <Link
                                key={ch.url}
                                href={`/reader?chapter_url=${encodeURIComponent(ch.url)}`}
                                className="block p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="font-medium truncate" title={ch.title}>
                                    {ch.title}
                                </div>
                            </Link>
                        ))}
                        {(!chapters || chapters.length === 0) && (
                            <p className="text-gray-500 col-span-full">No chapters found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MangaPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MangaContent />
        </Suspense>
    );
}
