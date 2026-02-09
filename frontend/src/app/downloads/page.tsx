import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

export default function DownloadsPage() {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Downloads
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label="Placeholder" size="small" color="warning" />
          <Typography variant="body2" color="text.secondary">
            Full download manager is deferred in this milestone.
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Planned Next
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Queue chapter downloads with status tracking" /></ListItem>
          <ListItem><ListItemText primary="Pause, resume, and cancel download jobs" /></ListItem>
          <ListItem><ListItemText primary="Expose downloaded chapters for offline reading" /></ListItem>
        </List>
      </Paper>
    </Box>
  );
}
