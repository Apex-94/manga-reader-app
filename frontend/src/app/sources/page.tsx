import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function SourcesPage() {
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

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sources</h1>
        <button
          onClick={reload}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
        >
          {busy ? "Reloading..." : "Reload Sources"}
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data?.sources || []).map((s: any) => (
              <li
                key={s.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-lg mb-2">{s.name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs uppercase">{s.language}</span>
                  <span>v{s.version}</span>
                </div>
              </li>
            ))}
          </ul>
          {data?.load_errors && Object.keys(data.load_errors).length > 0 && (
            <div className="mt-8 rounded-xl border border-red-200 p-6 bg-red-50 dark:bg-red-900/20">
              <div className="font-semibold text-red-700 dark:text-red-400 mb-2">
                Load errors
              </div>
              <pre className="text-xs whitespace-pre-wrap font-mono text-red-600 dark:text-red-300">
                {JSON.stringify(data.load_errors, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}