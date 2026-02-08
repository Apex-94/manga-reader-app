import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { explainChapter } from "../../services/geminiService";
import { ChevronLeft, ArrowLeft, ArrowRight, Sparkles, Settings2 } from "lucide-react";
import {
  Box,
  Typography,
  Paper,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  LinearProgress,
} from "@mui/material";

// Helper component to lazy resolve images
function PageImage({
  url,
  index,
  mode,
  source,
}: {
  url: string;
  chapterUrl: string;
  index: number;
  mode: "scroll" | "single";
  source: string | null;
  key?: any;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Check if URL is already an image (optimization)
  const isImage = useMemo(() => {
    return /\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url) || url.includes("picsum");
  }, [url]);

  // Build proxy URL for images to bypass CORS/hotlink protection
  const proxyUrl = useMemo(() => {
    if (!isImage) return null;
    const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
    return `${apiBaseUrl}/proxy?url=${encodeURIComponent(url)}&source=${encodeURIComponent(source || '')}`;
  }, [url, isImage, source]);

  useEffect(() => {
    if (isImage && proxyUrl) {
      // Use proxy for all external images to bypass CORS/hotlink protection
      setResolvedUrl(proxyUrl);
      return;
    }

    api
      .get("/manga/resolve", {
        params: { url, source },
      })
      .then((res) => {
        setResolvedUrl(res.data.url);
      })
      .catch((err) => {
        console.error("Failed to resolve image", err);
        setError(true);
      });
  }, [url, isImage, proxyUrl]);

  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#111827',
        color: '#ef4444',
        height: '24rem',
        width: '100%',
        mb: 0.5,
      }}>
        Failed to load page {index + 1}
      </Box>
    );
  }

  if (!resolvedUrl) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#111827',
        color: '#9ca3af',
        height: '60vh',
        width: '100%',
        mb: 0.5,
        borderRadius: 1,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <Typography variant="caption" sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
        }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={`p${index + 1}`}
      style={{
        width: mode === "scroll" ? '100%' : 'auto',
        height: mode === "scroll" ? 'auto' : '92vh',
        objectFit: mode === "scroll" ? 'cover' : 'contain',
        boxShadow: mode === "scroll" ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
        display: 'block',
        maxWidth: '100%',
        marginBottom: mode === "scroll" ? 0 : '0.5rem',
      }}
      loading="lazy"
    />
  );
}

export default function ReaderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chapterUrl = searchParams.get("chapter_url") || "";
  const source = searchParams.get("source");
  const [mode, setMode] = useState<"scroll" | "single">("single");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [idx, setIdx] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [aiTeaser, setAiTeaser] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["pages", chapterUrl, source],
    enabled: !!chapterUrl,
    queryFn: async () => {
      const resp = await api.get(`/manga/pages`, {
        params: { chapter_url: chapterUrl, source },
      });
      return resp.data;
    },
  });

  const pages: string[] = useMemo(() => data?.pages || [], [data]);
  const chapter = data?.chapter;
  const manga = data?.manga;

  useEffect(() => {
    setIdx(0);
    setAiTeaser(null);
    window.scrollTo(0, 0);
  }, [chapterUrl]);

  useEffect(() => {
    if (chapter?.title && manga?.title) {
      explainChapter(chapter.title, manga.title).then(setAiTeaser);
    }
  }, [chapter, manga]);

  if (!chapterUrl) return <Typography variant="body1" sx={{ p: 3 }}>Provide ?chapter_url=…</Typography>;
  if (!data) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'black', color: '#9ca3af' }}>Loading Reader...</Box>;

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'black', color: 'white', zIndex: 50, overflow: 'hidden' }}>

      {/* Top Controls */}
      <Paper sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        p: 1,
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 40,
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              color: '#9ca3af',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              },
              borderRadius: '50%',
            }}
          >
            <ChevronLeft size={24} />
          </IconButton>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" sx={{
              fontWeight: 'bold',
              color: '#d1d5db',
              display: 'block',
            }}>
              {manga?.title}
            </Typography>
            <Typography variant="caption" sx={{
              color: '#6b7280',
              display: 'block',
            }}>
              Chapter {chapter?.number}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Paper sx={{
            bgcolor: '#1f2937',
            borderRadius: 2,
            p: 0.25,
            display: 'flex',
            alignItems: 'center',
            border: 1,
            borderColor: '#374151',
          }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, newMode) => newMode && setMode(newMode)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  px: 2,
                  py: 0.75,
                  '&.Mui-selected': {
                    bgcolor: '#4f46e5',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    '&:hover': {
                      bgcolor: '#4338ca',
                    },
                  },
                  '&.Mui-selected.Mui-disabled': {
                    bgcolor: '#374151',
                    color: '#6b7280',
                  },
                },
              }}
            >
              <ToggleButton value="single">Single</ToggleButton>
              <ToggleButton value="scroll">Scroll</ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          <IconButton
            onClick={() => setDir(dir === "ltr" ? "rtl" : "ltr")}
            title="Toggle Reading Direction"
            sx={{
              bgcolor: '#1f2937',
              border: 1,
              borderColor: '#374151',
              borderRadius: '10px',
              color: '#9ca3af',
              '&:hover': {
                bgcolor: '#374151',
                color: 'white',
              },
            }}
          >
            <Settings2 size={16} />
          </IconButton>
        </Box>
      </Paper>

      {/* Tap zone to toggle controls */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 10 }} onClick={() => setShowControls(!showControls)} />

      {/* Main Content */}
      {mode === "scroll" ? (
        <Box sx={{
          height: '100%',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 20,
          bgcolor: '#000000',
        }}>
          <Box sx={{
            maxWidth: '48rem',
            mx: 'auto',
            pt: 8,
            pb: 8,
          }}>

            {/* AI Teaser */}
            {aiTeaser && (
              <Paper sx={{
                mx: 1,
                mb: 2,
                p: 3,
                bgcolor: 'rgba(31, 41, 55, 0.5)',
                border: 1,
                borderColor: 'rgba(79, 70, 229, 0.3)',
                borderRadius: 2,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 1,
                  background: 'linear-gradient(to right, transparent, #6366f1, transparent)',
                  opacity: 0.5,
                }} />
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  mb: 1,
                }}>
                  <Sparkles size={12} style={{ color: '#6366f1' }} />
                  <Typography variant="caption" sx={{
                    color: '#6366f1',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    AI Preview
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{
                  color: '#d1d5db',
                  fontStyle: 'italic',
                  lineHeight: 1.8,
                  maxWidth: '36rem',
                  mx: 'auto',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                }}>
                  "{aiTeaser}"
                </Typography>
              </Paper>
            )}

            <Box sx={{
              direction: dir === "rtl" ? "rtl" : "ltr",
            }}>
              {pages.map((p, i) => (
                <PageImage
                  key={`${chapterUrl}-${i}`}
                  url={p}
                  chapterUrl={chapterUrl}
                  index={i}
                  mode="scroll"
                  source={source}
                />
              ))}
            </Box>

            {/* Bottom Nav */}
            <Box sx={{ mt: 2.5, px: 1, display: 'flex', gap: 1 }}>
              <Button
                disabled={!data?.prev_slug}
                onClick={() => navigate(`/reader?chapter_url=${encodeURIComponent(data.prev_slug)}&source=${encodeURIComponent(source || '')}`)}
                variant="outlined"
                sx={{
                  flex: 1,
                  py: 1.5,
                  bgcolor: '#1f2937',
                  borderColor: '#374151',
                  color: '#d1d5db',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: '#374151',
                    borderColor: '#4b5563',
                    color: 'white',
                  },
                  '&:disabled': {
                    opacity: 0.3,
                    cursor: 'not-allowed',
                  },
                }}
              >
                Previous Chapter
              </Button>
              <Button
                disabled={!data?.next_slug}
                onClick={() => navigate(`/reader?chapter_url=${encodeURIComponent(data.next_slug)}&source=${encodeURIComponent(source || '')}`)}
                variant="contained"
                sx={{
                  flex: 1,
                  py: 1.5,
                  bgcolor: '#4f46e5',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: '#4338ca',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  },
                  '&:disabled': {
                    opacity: 0.3,
                    cursor: 'not-allowed',
                  },
                }}
              >
                Next Chapter
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 20,
          bgcolor: '#000000',
        }}>
          <Box sx={{
            position: 'absolute',
            left: 0,
            width: '8rem',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 1,
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent)',
            },
          }}>
            <IconButton
              onClick={(e) => { e.stopPropagation(); setIdx(Math.max(0, idx - 1)); }}
              sx={{
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
                '&:hover': {
                  transform: 'translateX(-8px)',
                  transition: 'transform 0.2s ease',
                },
              }}
            >
              <ArrowLeft size={40} />
            </IconButton>
          </Box>

          <Box sx={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            p: 0,
          }} onClick={() => setShowControls(!showControls)}>
            <PageImage
              key={`${chapterUrl}-${idx}`}
              url={pages[idx]}
              chapterUrl={chapterUrl}
              index={idx}
              mode="single"
              source={source}
            />
            {/* Page Indicator */}
            <Box sx={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: '#d1d5db',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 'medium',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              Page {idx + 1} / {pages.length}
            </Box>
          </Box>

          <Box sx={{
            position: 'absolute',
            right: 0,
            width: '8rem',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 1,
              background: 'linear-gradient(to left, rgba(0, 0, 0, 0.8), transparent)',
            },
          }}>
            <IconButton
              onClick={(e) => { e.stopPropagation(); setIdx(Math.min(pages.length - 1, idx + 1)); }}
              sx={{
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
                '&:hover': {
                  transform: 'translateX(8px)',
                  transition: 'transform 0.2s ease',
                },
              }}
            >
              <ArrowRight size={40} />
            </IconButton>
          </Box>

          {/* Page Indicator */}
          <Paper sx={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: showControls ? 'translateX(-50%) translateY(0) opacity(1)' : 'translateX(-50%) translateY(1rem) opacity(0)',
            px: 2,
            py: 0.5,
            bgcolor: 'rgba(31, 41, 55, 0.9)',
            backdropFilter: 'blur(8px)',
            border: 1,
            borderColor: '#374151',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            zIndex: 40,
          }}>
            <Typography variant="caption">
              Page {idx + 1} <span style={{ color: '#6b7280' }}>/</span> {pages.length}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Progress Bar */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        bgcolor: '#1f2937',
        zIndex: 50,
      }}>
        <LinearProgress
          variant="determinate"
          value={((idx + 1) / pages.length) * 100}
          sx={{
            height: '100%',
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#6366f1',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
              transition: 'width 0.3s ease',
            },
          }}
        />
      </Box>
    </Box>
  );
}