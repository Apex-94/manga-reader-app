import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { api, getProxyUrl, queueDownload } from "../../lib/api";
import { summarizeManga } from "../../services/geminiService";
import { Sparkles, BookOpen, Clock, PenTool, User } from "lucide-react";
import { Manga } from "../../types";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Stack,
  Button,
  CircularProgress,
  Container,
  Divider,
} from "@mui/material";

interface MangaDetails {
    id: string;
    title: string;
    description: string;
    author: string | null;
    artist: string | null;
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    genres: string[];
    thumbnail_url: string | null;
    source_url: string;
}

interface Chapter {
    title: string;
    url: string;
    chapter_number: number | null;
}

export default function MangaPage() {
    const [searchParams] = useSearchParams();
    const url = searchParams.get("url");
    const source = searchParams.get("source");
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [backdropError, setBackdropError] = useState(false);
    const queueMutation = useMutation({
        mutationFn: queueDownload,
    });

    const { data: details, isLoading: loadingDetails } = useQuery({
        queryKey: ["manga", url, source],
        queryFn: async () => {
            if (!url) return null;
            const resp = await api.get(`/manga/details`, { params: { url, source } });
            return resp.data as MangaDetails;
        },
        enabled: !!url,
    });

    const { data: chapters, isLoading: loadingChapters } = useQuery({
        queryKey: ["chapters", url, source],
        queryFn: async () => {
            if (!url) return [];
            const resp = await api.get(`/manga/chapters`, { params: { url, source } });
            return resp.data.chapters as Chapter[];
        },
        enabled: !!url,
    });

    const handleGenerateSummary = async () => {
        if (!details) return;
        setGeneratingSummary(true);
        // Cast details to Manga type for service
        const mangaObj: Manga = {
            ...details,
            altTitle: "",
            coverUrl: details.thumbnail_url || "",
            rating: 0,
            chapters: []
        };
        const summary = await summarizeManga(mangaObj);
        setAiSummary(summary);
        setGeneratingSummary(false);
    }

    if (!url) return <Box sx={{ p: 3 }}>No manga URL provided.</Box>;
    if (loadingDetails) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="primary" /></Box>;
    if (!details) return <Box sx={{ p: 3 }}>Failed to load details.</Box>;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Backdrop */}
            {!backdropError && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 400,
                    overflow: 'hidden',
                    zIndex: -1,
                    opacity: 0.3,
                }}>
                    <img
                        src={details.thumbnail_url ? getProxyUrl(details.thumbnail_url, source || '') : ''}
                        alt=""
                        onError={() => setBackdropError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)', transform: 'scale(1.25)' }}
                    />
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 1) 100%)',
                        '&.dark': {
                            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(17, 24, 39, 1) 100%)',
                        }
                    }} />
                </Box>
            )}

            <Box sx={{ pt: 8, pb: 6 }}>
                <Grid container spacing={6} mb={6}>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
                        <Box sx={{
                            aspectRatio: '2/3',
                            width: { xs: 192, md: '100%' },
                            bgcolor: { light: '#f3f4f6', dark: '#374151' },
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: 8,
                            border: 1,
                            borderColor: { light: 'rgba(0, 0, 0, 0.1)', dark: 'rgba(255, 255, 255, 0.1)' },
                            mb: 3,
                        }}>
                            {details.thumbnail_url && !imageError ? (
                                <img
                                    src={getProxyUrl(details.thumbnail_url, source || '')}
                                    alt={details.title}
                                    onError={() => setImageError(true)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Box sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(to bottom right, #d1d5db, #9ca3af)',
                                }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h1" sx={{ mb: 1 }}>📚</Typography>
                                        <Typography variant="body2" sx={{ color: { light: '#6b7280', dark: '#d1d5db' } }}>No image</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            {details.title}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                            {details.genres.map((g) => (
                                <Chip
                                    key={g}
                                    label={g}
                                    sx={{
                                        bgcolor: { light: 'rgba(255, 255, 255, 0.5)', dark: 'rgba(31, 41, 55, 0.5)' },
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '999px',
                                        border: 1,
                                        borderColor: { light: '#e5e7eb', dark: '#374151' },
                                        color: '#4f46e5',
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold',
                                    }}
                                />
                            ))}
                        </Stack>

                        <Stack direction="column" spacing={1} mb={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: { light: '#6b7280', dark: '#9ca3af' } }}>
                                    <User size={16} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: { light: '#111827', dark: '#f3f4f6' } }}>
                                    Author:
                                </Typography>
                                <Typography variant="body2" sx={{ color: { light: '#6b7280', dark: '#d1d5db' } }}>
                                    {details.author || "Unknown"}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: { light: '#6b7280', dark: '#9ca3af' } }}>
                                    <PenTool size={16} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: { light: '#111827', dark: '#f3f4f6' } }}>
                                    Artist:
                                </Typography>
                                <Typography variant="body2" sx={{ color: { light: '#6b7280', dark: '#d1d5db' } }}>
                                    {details.artist || "Unknown"}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: { light: '#6b7280', dark: '#9ca3af' } }}>
                                    <Clock size={16} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: { light: '#111827', dark: '#f3f4f6' } }}>
                                    Status:
                                </Typography>
                                <Chip
                                    label={details.status}
                                    size="small"
                                    sx={{
                                        bgcolor: details.status === 'Ongoing'
                                            ? { light: '#d1fae5', dark: 'rgba(34, 197, 94, 0.2)' }
                                            : { light: '#dbeafe', dark: 'rgba(59, 130, 246, 0.2)' },
                                        color: details.status === 'Ongoing'
                                            ? { light: '#065f46', dark: '#34d399' }
                                            : { light: '#1e40af', dark: '#60a5fa' },
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                />
                            </Box>
                        </Stack>

                        <Paper sx={{
                            bgcolor: { light: 'rgba(255, 255, 255, 0.6)', dark: 'rgba(31, 41, 55, 0.4)' },
                            backdropFilter: 'blur(8px)',
                            borderRadius: 2,
                            border: 1,
                            borderColor: { light: 'rgba(229, 231, 235, 0.5)', dark: 'rgba(55, 65, 81, 0.5)' },
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            <Box sx={{
                                p: 3,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Synopsis
                                </Typography>
                                <Button
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary}
                                    size="small"
                                    sx={{
                                        color: '#4f46e5',
                                        bgcolor: { light: 'rgba(79, 70, 229, 0.1)', dark: 'rgba(79, 70, 229, 0.2)' },
                                        borderRadius: '10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        minWidth: 'auto',
                                        padding: '4px 8px',
                                        '&:hover': {
                                            bgcolor: { light: 'rgba(79, 70, 229, 0.2)', dark: 'rgba(79, 70, 229, 0.3)' },
                                        },
                                        '&:disabled': {
                                            opacity: 0.5,
                                        },
                                    }}
                                >
                                    <Sparkles size={14} style={{ marginRight: 4 }} />
                                    {generatingSummary ? 'Thinking...' : 'AI Summarize'}
                                </Button>
                            </Box>

                            {aiSummary ? (
                                <Box sx={{
                                    animation: 'fadeIn 0.7s ease',
                                    bgcolor: { light: 'rgba(238, 242, 255, 0.5)', dark: 'rgba(79, 70, 229, 0.1)' },
                                    p: 2,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: { light: 'rgba(224, 231, 255, 0.3)', dark: 'rgba(79, 70, 229, 0.3)' },
                                    mb: 2,
                                    ml: 3,
                                    mr: 3,
                                }}>
                                    <Typography variant="body2" sx={{
                                        color: { light: '#312e81', dark: '#c7d2fe' },
                                        fontStyle: 'italic',
                                        lineHeight: 1.6,
                                        '&:before': {
                                            content: '"',
                                            fontSize: '1.5rem',
                                            color: '#6366f1',
                                            marginRight: '4px',
                                        },
                                        '&:after': {
                                            content: '"',
                                            fontSize: '1.5rem',
                                            color: '#6366f1',
                                            marginLeft: '4px',
                                        },
                                    }}>
                                        {aiSummary}
                                    </Typography>
                                </Box>
                            ) : null}

                            <Typography variant="body1" sx={{
                                color: { light: '#374151', dark: '#d1d5db' },
                                lineHeight: 1.8,
                                px: 3,
                                pb: 3,
                                fontSize: { xs: '0.875rem', md: '1rem' },
                            }}>
                                {details.description}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                        <Box sx={{ color: '#4f46e5' }}>
                            <BookOpen size={24} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            Chapters
                        </Typography>
                    </Box>

                    {loadingChapters ? (
                        <Grid container spacing={2}>
                            {[1, 2, 3].map(i => (
                                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Box sx={{
                                        height: 64,
                                        bgcolor: { light: '#f3f4f6', dark: '#374151' },
                                        borderRadius: 2,
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                    }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            {chapters && chapters.length > 0 ? (
                                chapters.slice().reverse().map((ch) => (
                                    <Grid key={ch.url} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                        <Paper sx={{
                                            p: 2,
                                            bgcolor: { light: 'white', dark: '#1f2937' },
                                            border: 1,
                                            borderColor: { light: '#e5e7eb', dark: '#374151' },
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: { light: 'rgba(79, 70, 229, 0.05)', dark: 'rgba(31, 41, 55, 0.8)' },
                                                borderColor: 'rgba(79, 70, 229, 0.3)',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                            }
                                        }}>
                                            <Link
                                                to={`/reader?chapter_url=${encodeURIComponent(ch.url)}&source=${encodeURIComponent(source || '')}`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Box sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: { light: '#f3f4f6', dark: '#374151' },
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                    }}>
                                                        <Typography variant="caption" sx={{
                                                            fontWeight: 'bold',
                                                            color: { light: '#6b7280', dark: '#9ca3af' },
                                                        }}>
                                                            {ch.chapter_number || '-'}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{
                                                        fontWeight: 'medium',
                                                        color: { light: '#111827', dark: '#f3f4f6' },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flexGrow: 1,
                                                    }}>
                                                        {ch.title}
                                                    </Typography>
                                                </Box>
                                            </Link>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                fullWidth
                                                onClick={() =>
                                                    queueMutation.mutate({
                                                        manga_title: details.title,
                                                        manga_url: url!,
                                                        source: source || 'mangakatana:en',
                                                        chapter_number: ch.chapter_number || 0,
                                                        chapter_url: ch.url,
                                                        chapter_title: ch.title,
                                                    })
                                                }
                                            >
                                                Download Chapter
                                            </Button>
                                        </Paper>
                                    </Grid>
                                ))
                            ) : (
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{
                                        color: { light: '#6b7280', dark: '#9ca3af' },
                                        textAlign: 'center',
                                        py: 6,
                                    }}>
                                        No chapters available.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
