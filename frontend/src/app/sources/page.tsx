"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});

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
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sources</h1>
        <button
          onClick={reload}
          disabled={busy}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Reloading…" : "Reload"}
        </button>
      </div>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.sources || []).map((s: any) => (
              <li
                key={s.id}
                className="rounded-xl border p-4 bg-white dark:bg-gray-800"
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-gray-500">
                  lang: {s.language} • v{s.version}
                </div>
              </li>
            ))}
          </ul>
          {data?.load_errors && Object.keys(data.load_errors).length > 0 && (
            <div className="mt-6 rounded-xl border border-red-300 p-4 bg-red-50 dark:bg-red-900">
              <div className="font-semibold text-red-700 dark:text-red-300">
                Load errors
              </div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(data.load_errors, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
