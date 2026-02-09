import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Paper, Button, Chip, Stack, Alert } from '@mui/material';
import { checkUpdates, getUpdates, markUpdateRead, queueDownload } from '../../lib/api';
import { UpdateItem } from '../../types';

export default function UpdatesPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: getUpdates,
  });

  const checkMutation = useMutation({
    mutationFn: checkUpdates,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['updates'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markUpdateRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['updates'] }),
  });

  const queueMutation = useMutation({
    mutationFn: (item: UpdateItem) =>
      queueDownload({
        manga_title: item.manga_title,
        manga_url: item.manga_url,
        source: item.source,
        chapter_number: item.chapter_number,
        chapter_url: item.chapter_url,
        chapter_title: item.chapter_title || undefined,
      }),
  });

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Updates
        </Typography>
        <Button variant="contained" onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}>
          {checkMutation.isPending ? 'Checking...' : 'Check Updates'}
        </Button>
      </Box>

      {checkMutation.data?.new_chapters > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Found {checkMutation.data.new_chapters} new chapters.
        </Alert>
      )}

      {isLoading && <Typography color="text.secondary">Loading updates...</Typography>}

      {!isLoading && data.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary">No updates tracked yet. Run “Check Updates” to sync library chapters.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {data.map((item: UpdateItem) => (
          <Paper key={item.id} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  {item.manga_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chapter {item.chapter_number}
                  {item.chapter_title ? ` • ${item.chapter_title}` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {item.is_downloaded && <Chip label="Downloaded" color="success" size="small" />}
                {!item.is_read && <Chip label="New" color="primary" size="small" />}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => markReadMutation.mutate(item.id)} disabled={item.is_read}>
                Mark Read
              </Button>
              <Button size="small" variant="outlined" onClick={() => queueMutation.mutate(item)} disabled={item.is_downloaded}>
                Download
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
