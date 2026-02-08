import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  Book as BookIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { getReadingHistory, deleteHistoryEntry, deleteMangaHistory, clearHistory } from '../lib/api';
import { HistoryEntry } from '../types';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getReadingHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load reading history',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    setLoading(true);
    try {
      await deleteHistoryEntry(entryId);
      setSnackbar({
        open: true,
        message: 'History entry deleted successfully',
        severity: 'success'
      });
      loadHistory();
    } catch (error) {
      console.error('Error deleting history entry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete history entry',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMangaHistory = async (mangaId: number) => {
    setLoading(true);
    try {
      await deleteMangaHistory(mangaId);
      setSnackbar({
        open: true,
        message: 'Manga history deleted successfully',
        severity: 'success'
      });
      loadHistory();
    } catch (error) {
      console.error('Error deleting manga history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete manga history',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setLoading(true);
    try {
      await clearHistory();
      setSnackbar({
        open: true,
        message: 'Reading history cleared successfully',
        severity: 'success'
      });
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to clear reading history',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteEntryDialog = (entryId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Delete History Entry',
      message: 'Are you sure you want to delete this history entry?',
      onConfirm: () => handleDeleteEntry(entryId)
    });
  };

  const openDeleteMangaHistoryDialog = (mangaId: number, mangaTitle: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Manga History',
      message: `Are you sure you want to delete all history entries for "${mangaTitle}"?`,
      onConfirm: () => handleDeleteMangaHistory(mangaId)
    });
  };

  const openClearHistoryDialog = () => {
    setConfirmDialog({
      open: true,
      title: 'Clear Reading History',
      message: 'Are you sure you want to clear all reading history? This action cannot be undone.',
      onConfirm: handleClearHistory
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? 'Just now' : `${minutes} min ago`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group history by manga
  const historyByManga: { [key: number]: HistoryEntry[] } = {};
  history.forEach(entry => {
    if (!historyByManga[entry.manga_id]) {
      historyByManga[entry.manga_id] = [];
    }
    historyByManga[entry.manga_id].push(entry);
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Reading History
        </Typography>
        {history.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={openClearHistoryDialog}
            disabled={loading}
          >
            Clear History
          </Button>
        )}
      </Box>

      {loading && !history.length ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading reading history...
          </Typography>
        </Paper>
      ) : history.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">No Reading History</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start reading manga to track your progress and build your reading history
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {history.length} {history.length === 1 ? 'entry' : 'entries'} in total
          </Typography>

          {Object.entries(historyByManga).map(([mangaId, entries]) => {
            const firstEntry = entries[0];
            return (
              <Card key={mangaId} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BookIcon fontSize="small" />
                        {firstEntry.manga?.title || `Manga #${mangaId}`}
                      </Typography>
                      {firstEntry.manga?.source && (
                        <Chip label={firstEntry.manga.source} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => openDeleteMangaHistoryDialog(parseInt(mangaId), firstEntry.manga?.title || '')}
                      disabled={loading}
                    >
                      Clear Manga History
                    </Button>
                  </Box>

                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Chapter</TableCell>
                          <TableCell>Read At</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={`Chapter ${entry.chapter_number}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                {entry.chapter?.title && (
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.chapter.title}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon fontSize="small" color="action" />
                              {formatDate(entry.read_at)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteEntryDialog(entry.id)}
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDialog.onConfirm();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
            disabled={loading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HistoryPage;
