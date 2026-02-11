import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, getProxyUrl } from "../../lib/api";
import { BookOpen } from "lucide-react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import { MangaCard } from "../../components/MangaCard";
import { Manga } from "../../types";
import { useLibraryState } from "../../hooks/useLibraryState";
import SetCategoriesPicker from "../../components/SetCategoriesPicker";
import LibraryFeedbackSnackbar from "../../components/LibraryFeedbackSnackbar";

interface LibraryItem {
  id: number;
  title: string;
  url: string;
  thumbnail_url?: string;
  source: string;
}

function toManga(item: LibraryItem): Manga {
  return {
    id: item.url,
    title: item.title,
    altTitle: "",
    author: null,
    status: "Ongoing",
    genres: [item.source],
    description: "",
    coverUrl: item.thumbnail_url ? getProxyUrl(item.thumbnail_url, item.source) : "",
    rating: 0,
    chapters: [],
  };
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { libraryQuery, removeByUrl } = useLibraryState();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerManga, setPickerManga] = useState<{ id?: number; title?: string }>({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: async (url: string) => {
      await api.delete(`/library/`, { params: { url } });
    },
    onSuccess: (_data, url) => {
      removeByUrl(url);
      setFeedbackOpen(true);
    },
  });

  const data = libraryQuery.data as LibraryItem[] | undefined;
  const isLoading = libraryQuery.isLoading;

  return (
    <Box>
      <Typography
        variant="h1"
        sx={{
          fontWeight: 700,
          mb: 3,
          fontSize: { xs: "1.5rem", md: "1.9rem" },
          lineHeight: 1.2,
        }}
      >
        My Library
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {(!data || data.length === 0) && (
            <Paper
              sx={{
                p: { xs: 3, md: 6 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "background.paper",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Box sx={{ color: "text.secondary" }}>
                  <BookOpen size={36} />
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Your library is empty
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 360, mb: 2.5 }}>
                Add manga from Browse to keep your reading list organized.
              </Typography>
              <Button component={Link} to="/browse" variant="contained">
                Go to Browse
              </Button>
            </Paper>
          )}

          {data && data.length > 0 && (
            <Box
              sx={{
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
              {data.map((it) => (
                <MangaCard
                  key={it.url}
                  manga={toManga(it)}
                  mangaSource={it.source}
                  showStatusBadge={false}
                  actionMode="auto"
                  libraryButtonState="in_library"
                  onOpenInLibrary={() => navigate('/library')}
                  onSetCategories={() => {
                    setPickerManga({ id: it.id, title: it.title });
                    setPickerOpen(true);
                  }}
                  onRemoveFromLibrary={() => removeMutation.mutate(it.url)}
                />
              ))}
            </Box>
          )}
        </>
      )}

      <SetCategoriesPicker
        open={pickerOpen}
        mangaId={pickerManga.id}
        mangaTitle={pickerManga.title}
        onClose={() => setPickerOpen(false)}
      />

      <LibraryFeedbackSnackbar
        open={feedbackOpen}
        message="Removed from Library"
        onClose={() => setFeedbackOpen(false)}
      />
    </Box>
  );
}
