import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, getProxyUrl } from "../../lib/api";
import { Sparkles, BookOpen, Filter, SlidersHorizontal } from "lucide-react";
import { MangaCard } from "../../components/MangaCard";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  IconButton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  CircularProgress,
  Container,
} from "@mui/material";

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
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: { xs: '300px', md: '400px' },
      borderRadius: 2,
      overflow: 'hidden',
      mb: 8,
      boxShadow: 8,
      '&:hover .hero-image': {
        transform: 'scale(1.05)',
      }
    }}>
      {/* Background Image with Blur */}
      <Box
        className="hero-image"
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${item.thumbnail_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
          opacity: { light: 0.5, dark: 0.4 },
          transition: 'transform 1s ease',
        }}
      />
      <Box sx={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
      }} />

      <Box sx={{
        position: 'absolute',
        inset: 0,
        p: { xs: 4, md: 8 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: { md: '50%' },
      }}>
        <Chip
          icon={<Sparkles size={14} />}
          label="FEATURED"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '999px',
            mb: 2,
            fontWeight: 'bold',
            fontSize: '0.75rem',
          }}
        />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            color: 'white',
            mb: 1,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.75rem', md: '3rem' },
          }}
        >
          {item.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {item.genres?.slice(0, 3).map((g, i) => (
            <Chip
              key={i}
              label={g}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          ))}
        </Stack>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 3,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: { xs: '0.875rem', md: '1rem' },
          }}
        >
          {item.description}
        </Typography>
        <Button
          component={Link}
          to={`/manga?url=${encodeURIComponent(item.url)}`}
          startIcon={<BookOpen size={20} />}
          sx={{
            bgcolor: '#4f46e5',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
            '&:hover': {
              bgcolor: '#4338ca',
              transform: 'translateY(-1px)',
              boxShadow: '0 12px 28px rgba(79, 70, 229, 0.4)',
            },
          }}
        >
          Read Now
        </Button>
      </Box>
    </Box>
  );
}

function MangaCardComponent({ item, onAdd }: { key?: any, item: MangaCard, onAdd: (item: MangaCard) => void }) {
  const handleAdd = (e: React.MouseEvent, id: string) => {
    // Convert browse manga format to library manga format
    onAdd({
      title: item.title,
      url: item.url,
      thumbnail_url: item.thumbnail_url,
      source: item.source || '',
      description: item.description,
      genres: item.genres || [],
    });
  };
  
  return (
    <MangaCard
      manga={{
        id: item.url,
        title: item.title,
        altTitle: '',
        author: null,
        status: 'Ongoing',
        genres: item.genres || [],
        description: '',
        coverUrl: item.thumbnail_url || '',
        rating: 0,
        chapters: []
      }}
      isFavorite={false}
      toggleFavorite={undefined}
      onAddToLibrary={handleAdd}
    />
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
      console.log("[Browse] Fetching data for", tab);
      if (q.trim() || activeFilters.length > 0) {
        const params: any = { q: q.trim() || "" };
        if (activeFilters.length > 0) {
          params.filters = JSON.stringify(activeFilters);
        }
        if (activeSource) {
          params.source = activeSource.id;
        }
        const resp = await api.get(`/manga/search`, { params });
        console.log("[Browse] Search results:", resp.data);
        return resp.data;
      }
      let endpoint = tab === "latest" ? "/manga/latest" : tab === "popular" ? "/manga/popular" : "/manga/random";
      console.log("[Browse] Fetching from:", endpoint);
      const resp = await api.get(endpoint);
      console.log("[Browse] Response:", resp.data);
      return resp.data;
    },
  });
  
  console.log("[Browse] Data state:", { data, isLoading, resultsCount: data?.results?.length });

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {!q && !isLoading && featuredManga && <HeroSection item={featuredManga} />}

      <Paper sx={{
        position: 'sticky',
        top: 80,
        zIndex: 20,
        bgcolor: { light: 'rgba(255, 255, 255, 0.95)', dark: 'rgba(31, 41, 55, 0.95)' },
        backdropFilter: 'blur(8px)',
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        border: 1,
        borderColor: { light: '#e5e7eb', dark: '#374151' },
        mb: 4,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 4,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 3,
              height: 32,
              background: 'linear-gradient(to bottom, #2563eb, #4f46e5)',
              borderRadius: '999px',
            }} />
            <Typography variant="h3" sx={{
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}>
              Browse Manga
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={tab}
              exclusive
              onChange={(e, newTab) => newTab && setTab(newTab)}
              size="small"
              sx={{
                bgcolor: { light: '#f3f4f6', dark: '#374151' },
                borderRadius: '12px',
                '& .MuiToggleButton-root': {
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  px: 3,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: 'white',
                    color: '#4f46e5',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    '&:hover': {
                      bgcolor: '#f9fafb',
                    },
                  },
                  '&.Mui-selected.Mui-disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#6b7280',
                  },
                },
              }}
            >
              <ToggleButton value="latest">Latest</ToggleButton>
              <ToggleButton value="popular">Popular</ToggleButton>
              <ToggleButton value="random">Random</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ flex: { xs: 1, md: 'none' } }}>
              <TextField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: { light: '#d1d5db', dark: '#4b5563' },
                    },
                    '&:hover fieldset': {
                      borderColor: { light: '#9ca3af', dark: '#6b7280' },
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4f46e5',
                    },
                  },
                }}
                onKeyPress={(e) => e.key === 'Enter' && refetch()}
              />
            </Box>

            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              title="Filters"
              sx={{
                border: 1,
                borderRadius: '12px',
                borderColor: showFilters || activeFilters.length > 0
                  ? 'rgba(79, 70, 229, 0.3)'
                  : { light: '#d1d5db', dark: '#4b5563' },
                bgcolor: showFilters || activeFilters.length > 0
                  ? 'rgba(79, 70, 229, 0.05)'
                  : 'transparent',
                color: showFilters || activeFilters.length > 0
                  ? '#4f46e5'
                  : { light: '#6b7280', dark: '#9ca3af' },
                '&:hover': {
                  bgcolor: showFilters || activeFilters.length > 0
                    ? 'rgba(79, 70, 229, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <SlidersHorizontal size={20} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {showFilters && filtersData?.filters && (
        <Paper sx={{
          mb: 4,
          p: 4,
          bgcolor: { light: '#f9fafb', dark: 'rgba(31, 41, 55, 0.5)' },
          borderRadius: 2,
          border: 1,
          borderColor: { light: '#e5e7eb', dark: '#374151' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ color: '#6366f1' }}>
                <Filter size={20} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Search Filters
              </Typography>
              {activeFilters.length > 0 && (
                <Chip
                  label={`${activeFilters.length} active`}
                  size="small"
                  sx={{
                    ml: 2,
                    bgcolor: { light: '#eef2ff', dark: 'rgba(79, 70, 229, 0.2)' },
                    color: '#4f46e5',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>
            <Button
              onClick={clearFilters}
              size="small"
              sx={{
                color: { light: '#6b7280', dark: '#9ca3af' },
                '&:hover': {
                  color: '#4f46e5',
                },
                textTransform: 'none',
              }}
            >
              Clear all
            </Button>
          </Box>

          <Grid container spacing={3}>
            {filtersData.filters.map((filter: any) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={filter.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {filter.name}
                  </Typography>
                  {filter.type === "select" || filter.type === "sort" ? (
                    <TextField
                      select
                      value={activeFilters.find(f => f.id === filter.id)?.value || ""}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          '& fieldset': {
                            borderColor: { light: '#d1d5db', dark: '#4b5563' },
                          },
                          '&:hover fieldset': {
                            borderColor: { light: '#9ca3af', dark: '#6b7280' },
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4f46e5',
                          },
                        },
                      }}
                    >
                      <option value="">Any</option>
                      {filter.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </TextField>
                  ) : filter.type === "multiselect" ? (
                    <Box sx={{
                      maxHeight: 160,
                      overflowY: 'auto',
                      p: 1,
                      border: 1,
                      borderColor: { light: '#d1d5db', dark: '#4b5563' },
                      borderRadius: '10px',
                      bgcolor: { light: 'white', dark: '#1f2937' },
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}>
                      {filter.options?.map((opt: any) => {
                        const isActive = (activeFilters.find(f => f.id === filter.id)?.value || []).includes(opt.value);
                        return (
                          <Chip
                            key={opt.value}
                            label={opt.label}
                            size="small"
                            onClick={() => {
                              const current = activeFilters.find(f => f.id === filter.id)?.value || [];
                              const next = isActive
                                ? current.filter((v: any) => v !== opt.value)
                                : [...current, opt.value];
                              handleFilterChange(filter.id, next);
                            }}
                            sx={{
                              bgcolor: isActive
                                ? '#4f46e5'
                                : { light: '#f3f4f6', dark: '#374151' },
                              color: isActive
                                ? 'white'
                                : { light: '#374151', dark: '#d1d5db' },
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              '&:hover': {
                                bgcolor: isActive
                                  ? '#4338ca'
                                  : { light: '#e5e7eb', dark: '#4b5563' },
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  ) : (
                    <TextField
                      type="text"
                      value={activeFilters.find(f => f.id === filter.id)?.value || ""}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      size="small"
                      fullWidth
                      placeholder={`Enter ${filter.name.toLowerCase()}...`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          '& fieldset': {
                            borderColor: { light: '#d1d5db', dark: '#4b5563' },
                          },
                          '&:hover fieldset': {
                            borderColor: { light: '#9ca3af', dark: '#6b7280' },
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4f46e5',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {(data?.results || []).map((it: any, i: number) => (
            <Grid size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2 }} key={i}>
              <MangaCardComponent item={it} onAdd={(item) => addMutation.mutate(item)} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}