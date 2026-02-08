import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { CheckCircle, Globe, RefreshCw } from "lucide-react";

export default function SourcesPage() {
  const queryClient = useQueryClient();
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const resp = await api.get(`/sources`);
      return resp.data;
    },
  });

  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setBusy(true);
    await api.post(`/sources/reload`);
    setBusy(false);
    refetch();
  };

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/sources/active`, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      // Also invalidate manga related queries to refresh content
      queryClient.invalidateQueries({ queryKey: ["browse"] });
    },
  });

  return (
    <div className="py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          Manga Sources
        </h1>
        <button
          onClick={reload}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all font-semibold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          {busy ? "Reloading..." : "Reload Sources"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data?.sources || []).map((s: any) => (
              <div
                key={s.id}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 ${s.is_active
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 shadow-md ring-1 ring-blue-500/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-xl text-gray-900 dark:text-gray-100">{s.name}</div>
                  {s.is_active && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold ring-1 ring-blue-700/10">
                      <CheckCircle className="w-3.5 h-3.5" />
                      ACTIVE
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">{s.language}</span>
                  <span className="font-medium text-xs">VERSION {s.version}</span>
                </div>

                {!s.is_active && (
                  <button
                    onClick={() => setActiveMutation.mutate(s.id)}
                    disabled={setActiveMutation.isPending}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold text-sm hover:bg-gray-800 dark:hover:bg-white transition-all transform active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {setActiveMutation.isPending && setActiveMutation.variables === s.id ? "Switching..." : "Switch to Source"}
                  </button>
                )}

                {s.is_active && (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm text-center">
                    Currently Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          {data?.load_errors && Object.keys(data.load_errors).length > 0 && (
            <div className="mt-12 overflow-hidden rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
              <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="font-bold text-red-800 dark:text-red-400">Extension Load Errors</h3>
              </div>
              <div className="p-6">
                <pre className="text-xs whitespace-pre-wrap font-mono text-red-600 dark:text-red-300 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                  {JSON.stringify(data.load_errors, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
