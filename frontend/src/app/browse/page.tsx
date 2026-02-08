import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, getProxyUrl } from "../../lib/api";
import { Sparkles, BookOpen, Filter, SlidersHorizontal } from "lucide-react";

interface MangaCard {
  title: string;
  url: string;
  thumbnail_url?: string;
  source: string;
  description?: string;
  genres?: string[];
}

function HeroSection({ item }: { item: MangaCard }) {
  if (!item) return null;
  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-10 group shadow-2xl">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-50 dark:opacity-40 transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url(${item.thumbnail_url})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

      <div className="absolute inset-0 p-8 flex flex-col justify-center max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold w-fit mb-4">
          <Sparkles className="w-3 h-3" /> FEATURED
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
          {item.title}
        </h2>
        <div className="flex gap-2 mb-4 text-xs md:text-sm text-gray-300 font-medium">
          {item.genres?.slice(0, 3).map((g, i) => (
            <span key={i} className="px-2 py-0.5 bg-white/10 rounded">{g}</span>
          ))}
        </div>
        <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-6 max-w-lg">
          {item.description}
        </p>
        <Link
          to={`/manga?url=${encodeURIComponent(item.url)}`}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all w-fit shadow-lg shadow-indigo-900/50 hover:scale-105"
        >
          <BookOpen className="w-5 h-5" />
          Read Now
        </Link>
      </div>
    </div>
  );
}

function Card({ item, onAdd }: { key?: any, item: MangaCard, onAdd: (item: MangaCard) => void }) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="block rounded-xl overflow-hidden border bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl hover:border-indigo-500/30 transition-all relative group h-full flex flex-col">
      <Link
        to={`/manga?url=${encodeURIComponent(item.url)}&source=${encodeURIComponent(item.source)}`}
        className="block flex-1"
      >
        <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
          {item.thumbnail_url && !imageError ? (
            <img
              src={getProxyUrl(item.thumbnail_url, item.source)}
              alt={item.title}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
              <div className="text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">No image</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-3">
          <div className="text-sm font-bold line-clamp-2 text-gray-900 dark:text-gray-100 mb-1 leading-tight group-hover:text-indigo-500 transition-colors">
            {item.title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.genres?.slice(0, 2).join(", ")}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{item.source}</div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAdd(item);
        }}
        className="absolute top-2 right-2 p-2 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-indigo-500 transform translate-y-2 group-hover:translate-y-0"
        title="Add to Library"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}

export default function BrowsePage() {
  const [tab, setTab] = useState<"latest" | "popular" | "random">("latest");
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch sources to find active one
  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const resp = await api.get(`/sources`);
      return resp.data;
    },
  });

  const activeSource = sourcesData?.sources?.find((s: any) => s.is_active);

  // Fetch filters for active source
  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSource?.id],
    queryFn: async () => {
      if (!activeSource) return { filters: [] };
      const resp = await api.get(`/manga/filters`, {
        params: { source: activeSource.id },
      });
      return resp.data;
    },
    enabled: !!activeSource,
  });

  const handleFilterChange = (filterId: string, value: any) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.id === filterId);
      if (existing) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return prev.filter(f => f.id !== filterId);
        }
        return prev.map(f => f.id === filterId ? { ...f, value } : f);
      }
      return [...prev, { id: filterId, value }];
    });
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setQ("");
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["browse", tab, q, activeFilters, activeSource?.id],
    queryFn: async () => {
      console.log("Fetching data for", tab, q, activeFilters);
      if (q.trim() || activeFilters.length > 0) {
        const params: any = { q: q.trim() || "" };
        if (activeFilters.length > 0) {
          params.filters = JSON.stringify(activeFilters);
        }
        if (activeSource) {
          params.source = activeSource.id;
        }
        const resp = await api.get(`/manga/search`, { params });
        return resp.data;
      }
      if (tab === "latest") {
        const resp = await api.get(`/manga/latest`);
        return resp.data;
      } else if (tab === "popular") {
        const resp = await api.get(`/manga/popular`);
        return resp.data;
      } else if (tab === "random") {
        const resp = await api.get(`/manga/random`);
        return resp.data;
      }
    },
  });

  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: async (item: MangaCard) => {
      await api.post(`/library`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => {
      alert("Failed to add to library.");
    }
  });

  const featuredManga = data?.results && data.results.length > 0 ? data.results[0] : null;

  return (
    <div className="py-8 animate-in fade-in duration-500">

      {!q && !isLoading && featuredManga && <HeroSection item={featuredManga} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 sticky top-[64px] z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur py-4 px-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
          Browse Manga
        </h1>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setTab("latest")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === "latest"
                ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-md border border-indigo-200 dark:border-indigo-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
              Latest
            </button>
            <button
              onClick={() => setTab("popular")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === "popular"
                ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-md border border-indigo-200 dark:border-indigo-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
              Popular
            </button>
            <button
              onClick={() => setTab("random")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === "random"
                ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-md border border-indigo-200 dark:border-indigo-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
              Random
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              refetch();
            }}
            className="flex-1 md:flex-none"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full md:w-64 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${showFilters || activeFilters.length > 0
              ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800"
              : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
              }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showFilters && filtersData?.filters && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-500" />
              Search Filters
              {activeFilters.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
                  {activeFilters.length} active
                </span>
              )}
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtersData.filters.map((filter: any) => (
              <div key={filter.id} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {filter.name}
                </label>
                {filter.type === "select" || filter.type === "sort" ? (
                  <select
                    value={activeFilters.find(f => f.id === filter.id)?.value || ""}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  >
                    <option value="">Any</option>
                    {filter.options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : filter.type === "multiselect" ? (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    {filter.options?.map((opt: any) => {
                      const isActive = (activeFilters.find(f => f.id === filter.id)?.value || []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const current = activeFilters.find(f => f.id === filter.id)?.value || [];
                            const next = isActive
                              ? current.filter((v: any) => v !== opt.value)
                              : [...current, opt.value];
                            handleFilterChange(filter.id, next);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isActive
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={activeFilters.find(f => f.id === filter.id)?.value || ""}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder={`Enter ${filter.name.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
          {(data?.results || []).map((it: any, i: number) => (
            <Card key={i} item={it} onAdd={(item) => addMutation.mutate(item)} />
          ))}
        </div>
      )}
    </div>
  );
}