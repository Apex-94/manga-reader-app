import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

export default function UpdatesPage() {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Updates
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label="Placeholder" size="small" color="warning" />
          <Typography variant="body2" color="text.secondary">
            Scheduler and notifications are deferred in this milestone.
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Planned Next
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Background update checks for library titles" /></ListItem>
          <ListItem><ListItemText primary="Show newly discovered chapters in-app" /></ListItem>
          <ListItem><ListItemText primary="Desktop notifications for new chapter availability" /></ListItem>
        </List>
      </Paper>
    </Box>
  );
}
