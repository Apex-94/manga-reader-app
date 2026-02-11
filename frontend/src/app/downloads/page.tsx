import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Paper, LinearProgress, Button, Chip, Stack, Alert } from '@mui/material';
import { cancelDownload, deleteDownloadFiles, getDownloads, pauseDownload, resumeDownload } from '../../lib/api';
import { DownloadItem } from '../../types';

export default function DownloadsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: getDownloads,
    refetchInterval: 1500,
  });

  const mutateAndRefresh = async (fn: () => Promise<void>) => {
    await fn();
    queryClient.invalidateQueries({ queryKey: ['downloads'] });
  };

  const pauseMutation = useMutation({
    mutationFn: (id: number) => mutateAndRefresh(() => pauseDownload(id)),
  });
  const resumeMutation = useMutation({
    mutationFn: (id: number) => mutateAndRefresh(() => resumeDownload(id)),
  });
  const cancelMutation = useMutation({
    mutationFn: (id: number) => mutateAndRefresh(() => cancelDownload(id)),
  });
  const deleteFilesMutation = useMutation({
    mutationFn: (id: number) => mutateAndRefresh(() => deleteDownloadFiles(id)),
  });

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Downloads
      </Typography>

      {isLoading && <Typography color="text.secondary">Loading downloads...</Typography>}

      {!isLoading && data.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary">No downloads queued yet. Queue chapters from the manga page.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {data.map((download: DownloadItem) => (
          <Paper key={download.id} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  {download.manga_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chapter {download.chapter_number}
                  {download.chapter_title ? ` • ${download.chapter_title}` : ''}
                </Typography>
              </Box>
              <Chip
                label={download.status.toUpperCase()}
                color={
                  download.status === 'completed'
                    ? 'success'
                    : download.status === 'failed'
                    ? 'error'
                    : download.status === 'paused'
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </Box>

            <LinearProgress
              variant="determinate"
              value={Math.round(download.progress * 100)}
              sx={{ height: 8, borderRadius: 4, mb: 1.25 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
              {download.downloaded_pages}/{download.total_pages || '?'} pages • {Math.round(download.progress * 100)}%
            </Typography>

            {download.error && (
              <Alert severity="error" sx={{ mb: 1.25 }}>
                {download.error}
              </Alert>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => pauseMutation.mutate(download.id)}
                disabled={download.status !== 'downloading' && download.status !== 'pending'}
              >
                Pause
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => resumeMutation.mutate(download.id)}
                disabled={download.status !== 'paused' && download.status !== 'failed'}
              >
                Resume
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => cancelMutation.mutate(download.id)}
                disabled={download.status === 'completed' || download.status === 'cancelled'}
              >
                Cancel
              </Button>
              <Button
                size="small"
                color="error"
                variant="contained"
                onClick={() => deleteFilesMutation.mutate(download.id)}
                disabled={!download.file_path}
              >
                Delete Files
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
