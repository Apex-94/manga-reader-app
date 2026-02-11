import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Globe, RefreshCw } from "lucide-react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";

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
      queryClient.invalidateQueries({ queryKey: ["browse"] });
    },
  });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
            <Globe size={28} />
            Manga Sources
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose a source for Browse/Search.
          </Typography>
        </Box>
        <Button
          onClick={reload}
          disabled={busy}
          startIcon={<RefreshCw size={16} />}
          variant="outlined"
          sx={{ borderRadius: 1.5, minHeight: 40 }}
        >
          {busy ? "Reloading..." : "Reload Sources"}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(auto-fit, minmax(280px, 1fr))",
              },
            }}
          >
            {(data?.sources || []).map((s: any) => {
              const isSwitching = setActiveMutation.isPending && setActiveMutation.variables === s.id;
              return (
                <Paper
                  key={s.id}
                  sx={{
                    borderRadius: 2,
                    border: 1,
                    borderColor: s.is_active ? "primary.main" : "divider",
                    p: 2.5,
                    bgcolor: s.is_active ? "action.selected" : "background.paper",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                      {s.name}
                    </Typography>
                    <Chip
                      label={s.is_active ? "Selected" : "Available"}
                      size="small"
                      color={s.is_active ? "primary" : "default"}
                      variant={s.is_active ? "filled" : "outlined"}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                    <Chip label={String(s.language || "N/A").toUpperCase()} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      Version {s.version}
                    </Typography>
                  </Box>

                  {s.is_active ? (
                    <Button fullWidth disabled variant="contained" sx={{ minHeight: 40 }}>
                      Selected
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setActiveMutation.mutate(s.id)}
                      disabled={setActiveMutation.isPending}
                      variant="contained"
                      fullWidth
                      sx={{ minHeight: 40 }}
                    >
                      {isSwitching ? "Switching..." : "Switch"}
                    </Button>
                  )}
                </Paper>
              );
            })}
          </Box>

          {data?.load_errors && Object.keys(data.load_errors).length > 0 && (
            <Paper
              sx={{
                mt: 3,
                borderRadius: 2,
                border: 1,
                borderColor: 'error.light',
                p: 2,
                bgcolor: 'rgba(239, 68, 68, 0.06)',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                Extension Load Errors
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: 'error.light',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(data.load_errors, null, 2)}
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
