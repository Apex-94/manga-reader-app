import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { getAppSettings, updateAppSetting } from '../../lib/api';

export default function SettingsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  });

  const [downloadConcurrency, setDownloadConcurrency] = useState('2');
  const [updateInterval, setUpdateInterval] = useState('60');
  const [readerMode, setReaderMode] = useState('single');
  const [readerDirection, setReaderDirection] = useState('ltr');

  useEffect(() => {
    if (!data) return;
    setDownloadConcurrency(String(data['downloads.max_concurrent'] ?? 2));
    setUpdateInterval(String(data['updates.interval_minutes'] ?? 60));
    setReaderMode(String(data['reader.default_mode'] ?? 'single'));
    setReaderDirection(String(data['reader.reading_direction'] ?? 'ltr'));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        updateAppSetting('downloads.max_concurrent', Number(downloadConcurrency)),
        updateAppSetting('updates.interval_minutes', Number(updateInterval)),
        updateAppSetting('reader.default_mode', readerMode),
        updateAppSetting('reader.reading_direction', readerDirection),
      ]);
    },
    onSuccess: async () => {
      await refetch();
    },
  });

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      {isLoading ? (
        <Typography color="text.secondary">Loading settings...</Typography>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={2}>
            {saveMutation.isSuccess && <Alert severity="success">Settings saved.</Alert>}
            {saveMutation.isError && <Alert severity="error">Failed to save settings.</Alert>}

            <TextField
              label="Max Concurrent Downloads"
              type="number"
              value={downloadConcurrency}
              onChange={(e) => setDownloadConcurrency(e.target.value)}
              inputProps={{ min: 1, max: 10 }}
            />
            <TextField
              label="Update Check Interval (minutes)"
              type="number"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(e.target.value)}
              inputProps={{ min: 5, max: 1440 }}
            />
            <TextField
              label="Default Reader Mode"
              select
              value={readerMode}
              onChange={(e) => setReaderMode(e.target.value)}
              helperText="Choose how pages are displayed by default."
            >
              <MenuItem value="single">Single page</MenuItem>
              <MenuItem value="scroll">Vertical scroll</MenuItem>
            </TextField>
            <TextField
              label="Default Reading Direction"
              select
              value={readerDirection}
              onChange={(e) => setReaderDirection(e.target.value)}
              helperText="Choose page progression direction."
            >
              <MenuItem value="ltr">Left to right (LTR)</MenuItem>
              <MenuItem value="rtl">Right to left (RTL)</MenuItem>
            </TextField>

            <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
