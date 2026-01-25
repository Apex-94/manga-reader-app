"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSearchParams } from "next/navigation";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});


export const dynamic = "force-dynamic";

// Helper component to lazy resolve images
function PageImage({
  url,
  chapterUrl,
  index,
  mode,
}: {
  url: string;
  chapterUrl: string;
  index: number;
  mode: "scroll" | "single";
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check if URL is already an image (optimization)
  const isImage = useMemo(() => {
    return /\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url);
  }, [url]);

  useEffect(() => {
    if (isImage) {
      setResolvedUrl(url);
      return;
    }

    setLoading(true);
    // Fetch resolved image
    api
      .get("/manga/resolve", {
        params: { url },
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
  }, [url, isImage]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900 text-red-500 h-96 w-full mb-2">
        Failed to load page {index + 1}
      </div>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-900 text-gray-500 h-96 w-full mb-2 animate-pulse">
        Loading page {index + 1}...
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${api.defaults.baseURL}/proxy_stream?url=${encodeURIComponent(resolvedUrl)}`}
      alt={`p${index + 1}`}
      className={
        mode === "scroll"
          ? "w-full mb-2"
          : "max-h-[92vh] object-contain"
      }
      loading="lazy"
    />
  );
}

function ReaderContent() {
  const searchParams = useSearchParams();
  const chapterUrl = searchParams.get("chapter_url") || "";
  const [mode, setMode] = useState<"scroll" | "single">("single");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [idx, setIdx] = useState(0);

  const { data } = useQuery({
    queryKey: ["pages", chapterUrl],
    enabled: !!chapterUrl,
    queryFn: async () => {
      const resp = await api.get(`/manga/pages`, {
        params: { chapter_url: chapterUrl },
      });
      return resp.data;
    },
  });

  const pages: string[] = useMemo(() => data?.pages || [], [data]);

  useEffect(() => {
    setIdx(0);
  }, [chapterUrl]);

  if (!chapterUrl) return <p className="p-6">Provide ?chapter_url=…</p>;
  if (!pages.length) return <p className="p-6">Loading pages…</p>;

  return (
    <div className="fixed inset-0 bg-black text-white">
      <header className="absolute top-0 left-0 right-0 p-3 bg-black/70 flex gap-2 z-10">
        <button
          className="px-3 py-1 rounded bg-white/10"
          onClick={() => setMode(mode === "single" ? "scroll" : "single")}
        >
          Mode: {mode}
        </button>
        <button
          className="px-3 py-1 rounded bg-white/10"
          onClick={() => setDir(dir === "ltr" ? "rtl" : "ltr")}
        >
          Direction: {dir.toUpperCase()}
        </button>
        <div className="ml-auto text-sm opacity-80">
          Page {idx + 1}/{pages.length}
        </div>
      </header>

      {mode === "scroll" ? (
        <div className="pt-14 pb-4 overflow-y-auto h-full">
          <div
            className={`mx-auto max-w-screen-md ${dir === "rtl" ? "direction-rtl" : ""
              }`}
          >
            {pages.map((p, i) => (
              <PageImage
                key={`${chapterUrl}-${i}`}
                url={p}
                chapterUrl={chapterUrl}
                index={i}
                mode="scroll"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-14 h-full flex items-center justify-between">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            className="h-full w-1/6 opacity-0 hover:opacity-50 z-10"
          >
            ‹
          </button>
          <div className="flex-1 h-full flex items-center justify-center relative">
            <PageImage
              key={`${chapterUrl}-${idx}`}
              url={pages[idx]}
              chapterUrl={chapterUrl}
              index={idx}
              mode="single"
            />
          </div>
          <button
            onClick={() => setIdx(Math.min(pages.length - 1, idx + 1))}
            className="h-full w-1/6 opacity-0 hover:opacity-50 z-10"
          >
            ›
          </button>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((idx + 1) / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading Reader...</p>}>
      <ReaderContent />
    </Suspense>
  );
}
