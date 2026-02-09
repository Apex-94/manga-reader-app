import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, getProxyUrl } from "../../lib/api";
import { BookOpen, Trash2 } from "lucide-react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  IconButton,
  CircularProgress,
  Container,
} from "@mui/material";

interface LibraryItem {
    title: string;
    url: string;
    thumbnail_url?: string;
    source: string;
}

function LibraryCard({ item, onRemove }: { key?: any, item: LibraryItem, onRemove: (url: string) => void }) {
    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: { light: '#e5e7eb', dark: '#374151' },
            bgcolor: { light: 'white', dark: '#1f2937' },
            transition: 'all 0.2s ease',
            '&:hover': {
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                borderColor: 'rgba(79, 70, 229, 0.3)',
            }
        }}>
            <Box sx={{ position: 'relative', aspectRatio: '3/4', bgcolor: { light: '#f3f4f6', dark: '#374151' }, overflow: 'hidden' }}>
                {item.thumbnail_url && (
                    <img
                        src={getProxyUrl(item.thumbnail_url, item.source)}
                        alt={item.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                )}
                <IconButton
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(item.url);
                    }}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: '#ef4444',
                        color: 'white',
                        opacity: 0,
                        transform: 'translateY(8px)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: '#dc2626',
                        },
                        '&:hover, &.Mui-focusVisible': {
                            opacity: 1,
                            transform: 'translateY(0)',
                        },
                        '&.MuiTouchRipple-root': {
                            opacity: 1,
                            transform: 'translateY(0)',
                        }
                    }}
                    title="Remove from Library"
                >
                    <Trash2 size={16} />
                </IconButton>
            </Box>
            <CardContent sx={{ p: 2, flexGrow: 1 }}>
                <Link
                    to={`/manga?url=${encodeURIComponent(item.url)}&source=${encodeURIComponent(item.source)}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 'bold',
                            color: { light: '#111827', dark: '#f3f4f6' },
                            mb: 0.5,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            '&:hover': {
                                color: '#6366f1',
                            }
                        }}
                    >
                        {item.title}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: { light: '#6b7280', dark: '#d1d5db' },
                        }}
                    >
                        {item.source}
                    </Typography>
                </Link>
            </CardContent>
        </Card>
    );
}

export default function LibraryPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["library"],
        queryFn: async () => {
            const resp = await api.get(`/library/`);
            return resp.data as LibraryItem[];
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (url: string) => {
            await api.delete(`/library/`, { params: { url } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["library"] });
        }
    });

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 4 }}>
                My Library
            </Typography>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    {(!data || data.length === 0) && (
                        <Paper sx={{
                            p: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            borderRadius: 2,
                            border: 1,
                            borderColor: { light: '#e5e7eb', dark: '#374151' },
                            bgcolor: { light: 'rgba(59, 130, 246, 0.05)', dark: 'rgba(59, 130, 246, 0.1)' },
                        }}>
                            <Box sx={{
                                width: 80,
                                height: 80,
                                bgcolor: { light: '#f3f4f6', dark: '#374151' },
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                            }}>
                                <Box sx={{ color: '#9ca3af' }}>
                                    <BookOpen size={40} />
                                </Box>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Your library is empty
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: { light: '#6b7280', dark: '#9ca3af' },
                                maxWidth: '300px',
                                mb: 3,
                            }}>
                                Star your favorite manga to keep track of them here.
                            </Typography>
                            <Button
                                component={Link}
                                to="/browse"
                                variant="contained"
                                sx={{
                                    bgcolor: '#3b82f6',
                                    color: 'white',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                                    '&:hover': {
                                        bgcolor: '#2563eb',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 12px 28px rgba(59, 130, 246, 0.4)',
                                    },
                                }}
                            >
                                Go to Browse
                            </Button>
                        </Paper>
                    )}
                    {data && data.length > 0 && (
                        <Grid container spacing={3}>
                            {data.map((it) => (
                                <Grid size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2 }} key={it.url}>
                                    <LibraryCard item={it} onRemove={(url) => removeMutation.mutate(url)} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}
        </Container>
    );
}