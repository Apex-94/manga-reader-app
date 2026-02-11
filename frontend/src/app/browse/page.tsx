import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, addToLibrary } from "../../lib/api";
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
import { useLibraryState } from "../../hooks/useLibraryState";
import LibraryFeedbackSnackbar from "../../components/LibraryFeedbackSnackbar";
import SetCategoriesPicker from "../../components/SetCategoriesPicker";
import { LibraryAddResponse } from "../../types";

interface MangaCardItem {
  title: string;
  url: string;
  thumbnail_url?: string;
  source: string;
  description?: string;
  genres?: string[];
}

function toMangaCardPayload(item: MangaCardItem) {
  return {
    title: item.title,
    url: item.url,
    thumbnail_url: item.thumbnail_url,
    source: item.source || "",
  };
}

export default function BrowsePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"latest" | "popular" | "random">("latest");
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackActions, setFeedbackActions] = useState<Array<{ label: string; onClick: () => void }>>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerManga, setPickerManga] = useState<{ id?: number; title?: string }>({});

  const [pendingUrls, setPendingUrls] = useState<Record<string, boolean>>({});

  const { isInLibrary, getLibraryManga, applyAddResult, removeByUrl } = useLibraryState();

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

  const removeMutation = useMutation({
    mutationFn: async (url: string) => {
      await api.delete(`/library/`, { params: { url } });
    },
    onSuccess: (_data, url) => {
      removeByUrl(url);
      setFeedbackMessage("Removed from Library");
      setFeedbackActions([]);
      setFeedbackOpen(true);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: MangaCardItem) => addToLibrary(toMangaCardPayload(item)),
    onMutate: (item) => {
      setPendingUrls((prev) => ({ ...prev, [item.url]: true }));
    },
    onSuccess: (resp: LibraryAddResponse, item) => {
      applyAddResult(resp);
      const libraryMangaId = resp.manga.id;
      const openPicker = () => {
        setPickerManga({ id: libraryMangaId, title: resp.manga.title });
        setPickerOpen(true);
      };

      if (resp.alreadyExists) {
        setFeedbackMessage("Already in Library");
        setFeedbackActions([
          { label: "Open", onClick: () => navigate("/library") },
          { label: "Set categories", onClick: openPicker },
        ]);
      } else {
        setFeedbackMessage("Added to Library");
        setFeedbackActions([
          { label: "Set categories", onClick: openPicker },
        ]);
      }
      setFeedbackOpen(true);
      setPendingUrls((prev) => ({ ...prev, [item.url]: false }));
    },
    onError: (_err, item) => {
      setPendingUrls((prev) => ({ ...prev, [item.url]: false }));
      setFeedbackMessage("Couldn't add to Library");
      setFeedbackActions([]);
      setFeedbackOpen(true);
    },
  });

  const browseItems: MangaCardItem[] = useMemo(() => data?.results || [], [data?.results]);

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
          {browseItems.map((it, i) => {
            const inLibrary = isInLibrary(it.url);
            const pending = !!pendingUrls[it.url];
            const libraryRecord = getLibraryManga(it.url);
            return (
              <MangaCard
                key={`${it.url}-${i}`}
                manga={{
                  id: it.url,
                  title: it.title,
                  altTitle: "",
                  author: null,
                  status: "Ongoing",
                  genres: it.genres || [],
                  description: "",
                  coverUrl: it.thumbnail_url || "",
                  rating: 0,
                  chapters: [],
                }}
                mangaSource={it.source}
                libraryButtonState={pending ? 'adding' : (inLibrary ? 'in_library' : 'not_in_library')}
                onAddToLibrary={() => addMutation.mutate(it)}
                onOpenInLibrary={() => navigate('/library')}
                onSetCategories={() => {
                  setPickerManga({ id: libraryRecord?.id, title: it.title });
                  setPickerOpen(true);
                }}
                onRemoveFromLibrary={() => removeMutation.mutate(it.url)}
                actionMode="auto"
                showStatusBadge
              />
            );
          })}
        </Box>
      )}

      <SetCategoriesPicker
        open={pickerOpen}
        mangaId={pickerManga.id}
        mangaTitle={pickerManga.title}
        onClose={() => setPickerOpen(false)}
      />

      <LibraryFeedbackSnackbar
        open={feedbackOpen}
        message={feedbackMessage}
        actions={feedbackActions}
        onClose={() => setFeedbackOpen(false)}
      />
    </Box>
  );
}
