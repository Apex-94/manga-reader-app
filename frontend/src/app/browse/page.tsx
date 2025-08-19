"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Base API instance. Adjust the URL depending on your backend host.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});

interface MangaCard {
  title: string;
  url: string;
  thumbnail_url?: string;
  source: string;
}

function Card({ item }: { item: MangaCard }) {
  return (
    <a
      href={`/reader?chapter_url=${encodeURIComponent(item.url)}`}
      className="block rounded-xl overflow-hidden border bg-white dark:bg-gray-800 hover:shadow"
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
    </a>
  );
}

export default function BrowsePage() {
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  const [q, setQ] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["browse", tab, q],
    queryFn: async () => {
      if (q.trim()) {
        const resp = await api.get(`/manga/search`, {
          params: { q },
        });
        return resp.data;
      }
      if (tab === "latest") {
        const resp = await api.get(`/manga/latest`);
        return resp.data;
      } else {
        const resp = await api.get(`/manga/popular`);
        return resp.data;
      }
    },
  });

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-4">Browse</h1>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("latest")}
          className={`px-3 py-1 rounded-lg ${
            tab === "latest"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          Latest
        </button>
        <button
          onClick={() => setTab("popular")}
          className={`px-3 py-1 rounded-lg ${
            tab === "popular"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          Popular
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            refetch();
          }}
          className="ml-auto"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title…"
            className="px-3 py-1.5 rounded-lg border bg-white dark:bg-gray-800"
          />
        </form>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {(data?.results || []).map((it: any, i: number) => (
            <Card key={i} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
