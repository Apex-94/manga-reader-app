import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Filter, SlidersHorizontal } from "lucide-react";
import { MangaCard } from "../../components/MangaCard";
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { SECTION_GAP } from "../../constants/layout";

interface MangaCardItem {
  title: string;
  url: string;
  thumbnail_url?: string;
  source: string;
  description?: string;
  genres?: string[];
}

function MangaCardComponent({ item, onAdd }: { item: MangaCardItem; onAdd: (item: MangaCardItem) => void }) {
  const handleAdd = (_e: React.MouseEvent, _id: string) => {
    onAdd({
      title: item.title,
      url: item.url,
      thumbnail_url: item.thumbnail_url,
      source: item.source || "",
      description: item.description,
      genres: item.genres || [],
    });
  };

  return (
    <MangaCard
      manga={{
        id: item.url,
        title: item.title,
        altTitle: "",
        author: null,
        status: "Ongoing",
        genres: item.genres || [],
        description: "",
        coverUrl: item.thumbnail_url || "",
        rating: 0,
        chapters: [],
      }}
      mangaSource={item.source}
      isFavorite={false}
      onAddToLibrary={handleAdd}
      actionMode="auto"
      showStatusBadge
    />
  );
}

export default function BrowsePage() {
  const [tab, setTab] = useState<"latest" | "popular" | "random">("latest");
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const resp = await api.get(`/sources`);
      return resp.data;
    },
  });

  const activeSource = sourcesData?.sources?.find((s: any) => s.is_active);

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
    setActiveFilters((prev) => {
      const existing = prev.find((f) => f.id === filterId);
      if (existing) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return prev.filter((f) => f.id !== filterId);
        }
        return prev.map((f) => (f.id === filterId ? { ...f, value } : f));
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
      const endpoint = tab === "latest" ? "/manga/latest" : tab === "popular" ? "/manga/popular" : "/manga/random";
      const resp = await api.get(endpoint);
      return resp.data;
    },
  });

  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: async (item: MangaCardItem) => {
      await api.post(`/library`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => {
      alert("Failed to add to library.");
    },
  });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: SECTION_GAP }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
          Browse Manga
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <ToggleButtonGroup
          value={tab}
          exclusive
          onChange={(_e, newTab) => newTab && setTab(newTab)}
          size="small"
          sx={{
            height: 40,
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              px: 1.5,
              py: 0.75,
              minHeight: 40,
              textTransform: "uppercase",
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value="latest">Latest</ToggleButton>
          <ToggleButton value="popular">Popular</ToggleButton>
          <ToggleButton value="random">Random</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search manga"
          size="small"
          fullWidth
          onKeyDown={(e) => e.key === "Enter" && refetch()}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 40,
              borderRadius: 1.5,
            },
          }}
        />

        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          title="Filters"
          sx={{
            height: 40,
            width: 40,
            border: 1,
            borderRadius: 1.5,
            borderColor: showFilters || activeFilters.length > 0 ? "primary.main" : "divider",
            color: showFilters || activeFilters.length > 0 ? "primary.main" : "text.secondary",
            bgcolor: showFilters || activeFilters.length > 0 ? "action.selected" : "transparent",
          }}
        >
          <SlidersHorizontal size={18} />
        </IconButton>
      </Paper>

      {showFilters && filtersData?.filters && (
        <Paper
          sx={{
            mt: SECTION_GAP,
            p: 2,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Filter size={18} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                Search Filters
              </Typography>
              {activeFilters.length > 0 && <Chip label={`${activeFilters.length} active`} size="small" color="primary" />}
            </Box>
            <Button onClick={clearFilters} size="small">
              Clear all
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {filtersData.filters.map((filter: any) => (
              <Box key={filter.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {filter.name}
                </Typography>
                {filter.type === "select" || filter.type === "sort" ? (
                  <TextField
                    select
                    value={activeFilters.find((f) => f.id === filter.id)?.value || ""}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">Any</MenuItem>
                    {filter.options?.map((opt: any) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : filter.type === "multiselect" ? (
                  <Box
                    sx={{
                      maxHeight: 160,
                      overflowY: "auto",
                      p: 1,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1.25,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    {filter.options?.map((opt: any) => {
                      const isActive = (activeFilters.find((f) => f.id === filter.id)?.value || []).includes(opt.value);
                      return (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          size="small"
                          onClick={() => {
                            const current = activeFilters.find((f) => f.id === filter.id)?.value || [];
                            const next = isActive ? current.filter((v: any) => v !== opt.value) : [...current, opt.value];
                            handleFilterChange(filter.id, next);
                          }}
                          color={isActive ? "primary" : "default"}
                          variant={isActive ? "filled" : "outlined"}
                        />
                      );
                    })}
                  </Box>
                ) : (
                  <TextField
                    type="text"
                    value={activeFilters.find((f) => f.id === filter.id)?.value || ""}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={`Enter ${filter.name.toLowerCase()}...`}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 3,
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(150px, 1fr))",
              sm: "repeat(auto-fill, minmax(180px, 1fr))",
              md: "repeat(auto-fill, minmax(210px, 1fr))",
              lg: "repeat(auto-fill, minmax(240px, 1fr))",
            },
          }}
        >
          {(data?.results || []).map((it: any, i: number) => (
            <MangaCardComponent key={`${it.url}-${i}`} item={it} onAdd={(item) => addMutation.mutate(item)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
