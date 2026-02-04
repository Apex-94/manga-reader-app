import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { explainChapter } from "../../services/geminiService";
import { ChevronLeft, ArrowLeft, ArrowRight, Sparkles, Settings2 } from "lucide-react";

// Helper component to lazy resolve images
function PageImage({
  url,
  chapterUrl,
  index,
  mode,
  source,
}: {
  url: string;
  chapterUrl: string;
  index: number;
  mode: "scroll" | "single";
  source: string | null;
  key?: any;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check if URL is already an image (optimization)
  const isImage = useMemo(() => {
    return /\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url) || url.includes("picsum");
  }, [url]);

  // Build proxy URL for images to bypass CORS/hotlink protection
  const proxyUrl = useMemo(() => {
    if (!isImage) return null;
    const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
    return `${apiBaseUrl}/proxy?url=${encodeURIComponent(url)}&source=${encodeURIComponent(source || '')}`;
  }, [url, isImage, source]);

  useEffect(() => {
    if (isImage && proxyUrl) {
      // Use proxy for all external images to bypass CORS/hotlink protection
      setResolvedUrl(proxyUrl);
      return;
    }

    setLoading(true);
    api
      .get("/manga/resolve", {
        params: { url, source },
      })
      .then((res) => {
        setResolvedUrl(res.data.url);
      })
      .catch((err) => {
        console.error("Failed to resolve image", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, isImage, proxyUrl]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900 text-red-500 h-96 w-full mb-2">
        Failed to load page {index + 1}
      </div>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-900 text-gray-500 h-[60vh] w-full mb-2 animate-pulse rounded-lg">
        <span className="text-xs uppercase tracking-widest">Loading...</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={`p${index + 1}`}
      className={
        mode === "scroll"
          ? "w-full mb-0 shadow-lg"
          : "max-h-[92vh] max-w-full object-contain"
      }
      loading="lazy"
    />
  );
}

export default function ReaderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chapterUrl = searchParams.get("chapter_url") || "";
  const source = searchParams.get("source");
  const [mode, setMode] = useState<"scroll" | "single">("single");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [idx, setIdx] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [aiTeaser, setAiTeaser] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["pages", chapterUrl, source],
    enabled: !!chapterUrl,
    queryFn: async () => {
      const resp = await api.get(`/manga/pages`, {
        params: { chapter_url: chapterUrl, source },
      });
      return resp.data;
    },
  });

  const pages: string[] = useMemo(() => data?.pages || [], [data]);
  const chapter = data?.chapter;
  const manga = data?.manga;

  useEffect(() => {
    setIdx(0);
    setAiTeaser(null);
    window.scrollTo(0, 0);
  }, [chapterUrl]);

  useEffect(() => {
    if (chapter?.title && manga?.title) {
      explainChapter(chapter.title, manga.title).then(setAiTeaser);
    }
  }, [chapter, manga]);

  if (!chapterUrl) return <p className="p-6">Provide ?chapter_url=…</p>;
  if (!data) return <div className="flex items-center justify-center h-screen bg-black text-zinc-500">Loading Reader...</div>;

  return (
    <div className="fixed inset-0 bg-black text-white z-50 overflow-hidden">

      {/* Top Controls */}
      <header
        className={`absolute top-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-b border-white/10 flex justify-between items-center z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-gray-200">{manga?.title}</h1>
            <p className="text-xs text-gray-500">Chapter {chapter?.number}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="bg-zinc-900 rounded-lg p-1 flex items-center border border-zinc-800">
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${mode === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setMode("single")}
            >
              Single
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${mode === 'scroll' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setMode("scroll")}
            >
              Scroll
            </button>
          </div>

          <button
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white transition-colors"
            onClick={() => setDir(dir === "ltr" ? "rtl" : "ltr")}
            title="Toggle Reading Direction"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tap zone to toggle controls */}
      <div className="absolute inset-0 z-10" onClick={() => setShowControls(!showControls)} />

      {/* Main Content */}
      {mode === "scroll" ? (
        <div className="pt-0 pb-0 overflow-y-auto h-full relative z-20 bg-zinc-950">
          <div className="max-w-screen-md mx-auto pt-20 pb-20">

            {/* AI Teaser */}
            {aiTeaser && (
              <div className="mx-4 mb-8 p-6 bg-zinc-900/50 border border-indigo-900/30 rounded-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50"></div>
                <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" /> AI Preview
                </span>
                <p className="text-gray-300 italic text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                  "{aiTeaser}"
                </p>
              </div>
            )}

            <div className={dir === "rtl" ? "direction-rtl" : ""}>
              {pages.map((p, i) => (
                <PageImage
                  key={`${chapterUrl}-${i}`}
                  url={p}
                  chapterUrl={chapterUrl}
                  index={i}
                  mode="scroll"
                  source={source}
                />
              ))}
            </div>

            {/* Bottom Nav */}
            <div className="mt-10 px-4 flex gap-4">
              <button
                disabled={!data?.prev_slug}
                onClick={() => navigate(`/reader?chapter_url=${encodeURIComponent(data.prev_slug)}&source=${encodeURIComponent(source || '')}`)}
                className="flex-1 py-4 bg-zinc-900 text-gray-300 rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
              >
                Previous Chapter
              </button>
              <button
                disabled={!data?.next_slug}
                onClick={() => navigate(`/reader?chapter_url=${encodeURIComponent(data.next_slug)}&source=${encodeURIComponent(source || '')}`)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
              >
                Next Chapter
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-between relative z-20 bg-zinc-950">
          <button
            onClick={(e) => { e.stopPropagation(); setIdx(Math.max(0, idx - 1)); }}
            className="h-full w-32 opacity-0 hover:opacity-100 flex items-center justify-center z-30 hover:bg-gradient-to-r from-black/80 to-transparent absolute left-0 transition-all group"
          >
            <ArrowLeft className="w-10 h-10 text-white drop-shadow-lg transform group-hover:-translate-x-2 transition-transform" />
          </button>

          <div className="flex-1 h-full flex items-center justify-center relative p-0" onClick={() => setShowControls(!showControls)}>
            <PageImage
              key={`${chapterUrl}-${idx}`}
              url={pages[idx]}
              chapterUrl={chapterUrl}
              index={idx}
              mode="single"
              source={source}
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setIdx(Math.min(pages.length - 1, idx + 1)); }}
            className="h-full w-32 opacity-0 hover:opacity-100 flex items-center justify-center z-30 hover:bg-gradient-to-l from-black/80 to-transparent absolute right-0 transition-all group"
          >
            <ArrowRight className="w-10 h-10 text-white drop-shadow-lg transform group-hover:translate-x-2 transition-transform" />
          </button>

          {/* Page Indicator */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-full text-sm font-medium text-white shadow-xl transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Page {idx + 1} <span className="text-zinc-500">/</span> {pages.length}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800 z-50">
        <div
          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300"
          style={{ width: `${((idx + 1) / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}