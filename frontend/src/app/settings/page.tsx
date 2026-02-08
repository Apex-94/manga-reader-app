import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Settings page - Coming soon!
        </Typography>
      </Paper>
    </Box>
  );
}
