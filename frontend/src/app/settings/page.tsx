import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

export default function SettingsPage() {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label="Placeholder" size="small" color="warning" />
          <Typography variant="body2" color="text.secondary">
            Reader/app settings persistence improvements are deferred in this milestone.
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Planned Next
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Reader mode defaults and shortcuts customization" /></ListItem>
          <ListItem><ListItemText primary="Download behavior and storage location preferences" /></ListItem>
          <ListItem><ListItemText primary="Backup/restore for library metadata and progress" /></ListItem>
        </List>
      </Paper>
    </Box>
  );
}
