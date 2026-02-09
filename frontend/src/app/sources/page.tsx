import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { CheckCircle, Globe, RefreshCw } from "lucide-react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Container,
  Divider,
  useTheme,
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
  const theme = useTheme();

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
      // Also invalidate manga related queries to refresh content
      queryClient.invalidateQueries({ queryKey: ["browse"] });
    },
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: '#3b82f6' }}>
            <Globe size={32} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Manga Sources
          </Typography>
        </Box>
        <Button
          onClick={reload}
          disabled={busy}
          startIcon={<RefreshCw size={16} className={busy ? 'animate-spin' : ''} />}
          variant="outlined"
          sx={{
            borderRadius: '12px',
            px: 2,
            py: 1,
            fontWeight: 'bold',
            bgcolor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
              borderColor: theme.palette.primary.main,
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          {busy ? "Reloading..." : "Reload Sources"}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {(data?.sources || []).map((s: any) => (
              <Grid key={s.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Paper sx={{
                  borderRadius: '16px',
                  border: 1,
                  borderColor: s.is_active
                    ? 'rgba(59, 130, 246, 0.3)'
                    : theme.palette.divider,
                  p: 3,
                  transition: 'all 0.3s ease',
                  bgcolor: s.is_active
                    ? 'rgba(59, 130, 246, 0.05)'
                    : theme.palette.background.paper,
                  boxShadow: s.is_active
                    ? '0 4px 20px rgba(59, 130, 246, 0.1)'
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  },
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                      {s.name}
                    </Typography>
                    {s.is_active && (
                      <Chip
                        icon={<CheckCircle size={14} />}
                        label="ACTIVE"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(59, 130, 246, 0.2)',
                          color: '#1d4ed8',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          borderRadius: '999px',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Chip
                      label={s.language}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      VERSION {s.version}
                    </Typography>
                  </Box>

                  {!s.is_active && (
                    <Button
                      onClick={() => setActiveMutation.mutate(s.id)}
                      disabled={setActiveMutation.isPending}
                      variant="contained"
                      fullWidth
                      sx={{
                        borderRadius: '12px',
                        py: 1.25,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        bgcolor: theme.palette.text.primary,
                        color: theme.palette.background.paper,
                        '&:hover': {
                          bgcolor: theme.palette.text.secondary,
                        },
                        '&:disabled': {
                          opacity: 0.5,
                        },
                        transition: 'all 0.2s ease',
                        transform: setActiveMutation.isPending && setActiveMutation.variables === s.id ? 'scale(0.95)' : 'scale(1)',
                      }}
                    >
                      {setActiveMutation.isPending && setActiveMutation.variables === s.id ? "Switching..." : "Switch to Source"}
                    </Button>
                  )}

                  {s.is_active && (
                    <Box sx={{
                      borderRadius: '12px',
                      py: 1.25,
                      px: 2,
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      border: 1,
                      borderColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}>
                      Currently Selected
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {data?.load_errors && Object.keys(data.load_errors).length > 0 && (
            <Paper sx={{
              mt: 4,
              borderRadius: '16px',
              border: 1,
              borderColor: 'rgba(239, 68, 68, 0.2)',
              bgcolor: 'rgba(239, 68, 68, 0.05)',
              overflow: 'hidden',
            }}>
              <Box sx={{
                px: 3,
                py: 2,
                borderBottom: 1,
                borderColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#ef4444',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                  Extension Load Errors
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Paper sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  border: 1,
                  borderColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px',
                  p: 2,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}>
                  {JSON.stringify(data.load_errors, null, 2)}
                </Paper>
              </Box>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
