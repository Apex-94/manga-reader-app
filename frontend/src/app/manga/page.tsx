import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import { summarizeManga } from "../../services/geminiService";
import { Sparkles, BookOpen, Clock, PenTool, User } from "lucide-react";
import { Manga } from "../../types";

interface MangaDetails {
    id: string;
    title: string;
    description: string;
    author: string | null;
    artist: string | null;
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    genres: string[];
    thumbnail_url: string | null;
    source_url: string;
}

interface Chapter {
    title: string;
    url: string;
    chapter_number: number | null;
}

export default function MangaPage() {
    const [searchParams] = useSearchParams();
    const url = searchParams.get("url");
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [backdropError, setBackdropError] = useState(false);

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

    const handleGenerateSummary = async () => {
        if (!details) return;
        setGeneratingSummary(true);
        // Cast details to Manga type for service
        const mangaObj: Manga = {
            ...details,
            altTitle: "",
            coverUrl: details.thumbnail_url || "",
            rating: 0,
            chapters: []
        };
        const summary = await summarizeManga(mangaObj);
        setAiSummary(summary);
        setGeneratingSummary(false);
    }

    if (!url) return <div className="p-6">No manga URL provided.</div>;
    if (loadingDetails) return <div className="p-6 flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (!details) return <div className="p-6">Failed to load details.</div>;

    return (
        <div className="relative animate-in fade-in duration-500">
             {/* Backdrop */}
             {!backdropError && (
             <div className="absolute top-0 left-0 w-full h-[400px] overflow-hidden -z-10 opacity-30 mask-image-gradient">
                <img 
                    src={details.thumbnail_url ? `http://localhost:8000/api/v1/proxy?url=${encodeURIComponent(details.thumbnail_url)}&source=mangahere:en` : ''} 
                    alt="" 
                    onError={() => setBackdropError(true)}
                    className="w-full h-full object-cover blur-3xl scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white dark:from-black/10 dark:to-gray-900" />
            </div>
             )}

            <div className="pt-10 pb-8">
                <div className="flex flex-col md:flex-row gap-10 mb-12">
                    <div className="w-full md:w-72 flex-shrink-0 flex flex-col items-center md:items-start">
                        <div className="aspect-[2/3] w-48 md:w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 dark:ring-white/10 mb-6">
                            {details.thumbnail_url && !imageError ? (
                                <img
                                    src={`http://localhost:8000/api/v1/proxy?url=${encodeURIComponent(details.thumbnail_url)}&source=mangahere:en`}
                                    alt={details.title}
                                    onError={() => setImageError(true)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📚</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">No image</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{details.title}</h1>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            {details.genres.map((g) => (
                                <span key={g} className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400">
                                    {g}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 mb-8 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" /> 
                                <span className="font-semibold text-gray-900 dark:text-gray-200">Author:</span> {details.author || "Unknown"}
                            </div>
                            <div className="flex items-center gap-2">
                                <PenTool className="w-4 h-4" />
                                <span className="font-semibold text-gray-900 dark:text-gray-200">Artist:</span> {details.artist || "Unknown"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="font-semibold text-gray-900 dark:text-gray-200">Status:</span> 
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                    details.status === 'Ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {details.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    Synopsis
                                </h3>
                                <button 
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary}
                                    className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {generatingSummary ? 'Thinking...' : 'AI Summarize'}
                                </button>
                            </div>
                            
                            {aiSummary ? (
                                <div className="animate-in fade-in duration-700 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-3">
                                     <p className="text-indigo-900 dark:text-indigo-200 italic text-sm leading-relaxed">
                                        <Sparkles className="w-3 h-3 inline mr-1 text-indigo-500" />
                                        "{aiSummary}"
                                     </p>
                                </div>
                            ) : null}

                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                                {details.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        Chapters
                    </h2>
                    {loadingChapters ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[1,2,3].map(i => <div key={i} className="animate-pulse h-16 w-full bg-gray-200 dark:bg-gray-800 rounded-lg"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {chapters && chapters.length > 0 ? (
                                chapters.slice().reverse().map((ch) => (
                                    <Link
                                        key={ch.url}
                                        to={`/reader?chapter_url=${encodeURIComponent(ch.url)}`}
                                        className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all hover:border-indigo-500/50 hover:shadow-md group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 text-xs font-bold text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            {ch.chapter_number || '-'}
                                        </div>
                                        <div className="font-medium truncate group-hover:text-indigo-600 transition-colors text-sm" title={ch.title}>
                                            {ch.title}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-full py-8 text-center">No chapters available.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}