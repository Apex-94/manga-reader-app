import React from 'react';
import { Alert, Box, Button, Snackbar, useMediaQuery, useTheme } from '@mui/material';

interface SnackbarAction {
  label: string;
  onClick: () => void;
}

interface LibraryFeedbackSnackbarProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  actions?: SnackbarAction[];
}

export default function LibraryFeedbackSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  actions = [],
}: LibraryFeedbackSnackbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Snackbar
      open={open}
      autoHideDuration={3200}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: isMobile ? 'center' : 'right',
      }}
      sx={{
        mb: isMobile ? '84px' : 2,
      }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        variant="filled"
        sx={{ width: '100%', alignItems: 'center' }}
        action={
          actions.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {actions.slice(0, 2).map((action) => (
                <Button
                  key={action.label}
                  color="inherit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
