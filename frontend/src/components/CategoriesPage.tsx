import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
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
  Skeleton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LibraryBooks as LibraryBooksIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryManga,
  removeMangaFromCategory,
} from '../lib/api';
import { Category, Manga } from '../types';
import { MangaCard } from './MangaCard';

const CategoriesPage: React.FC = () => {
  type SnackbarSeverity = 'success' | 'error';
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryManga, setCategoryManga] = useState<Manga[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [categoryName, setCategoryName] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingManga, setLoadingManga] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarSeverity }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setSnackbar({ open: true, message: 'Failed to load categories', severity: 'error' });
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoryManga = async (categoryId: number) => {
    setLoadingManga(true);
    try {
      const data = await getCategoryManga(categoryId);
      setCategoryManga(data as Manga[]);
    } catch (error) {
      console.error('Error loading category manga:', error);
      setSnackbar({ open: true, message: 'Failed to load category manga', severity: 'error' });
    } finally {
      setLoadingManga(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      await createCategory(categoryName.trim());
      setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
      setOpenDialog(false);
      setCategoryName('');
      loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      setSnackbar({ open: true, message: 'Failed to create category', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) return;
    setSaving(true);
    try {
      await updateCategory(selectedCategory.id, categoryName.trim());
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
      setOpenDialog(false);
      setCategoryName('');
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      setSnackbar({ open: true, message: 'Failed to update category', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setSaving(true);
    try {
      await deleteCategory(categoryId);
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
        setCategoryManga([]);
      }
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMangaFromCategory = async (mangaId: number) => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      await removeMangaFromCategory(selectedCategory.id, mangaId);
      setSnackbar({ open: true, message: 'Manga removed from category', severity: 'success' });
      loadCategoryManga(selectedCategory.id);
    } catch (error) {
      console.error('Error removing manga from category:', error);
      setSnackbar({ open: true, message: 'Failed to remove manga from category', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setCategoryName('');
    setOpenDialog(true);
  };

  const openEditDialog = (category: Category) => {
    setDialogMode('edit');
    setSelectedCategory(category);
    setCategoryName(category.name);
    setOpenDialog(true);
  };

  const isCreateDisabled = loadingCategories || loadingManga || saving;

  const categoryList = (
    <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 700 }}>
          Categories
        </Typography>
        <Tooltip title={isCreateDisabled ? 'Please wait while data is loading.' : ''}>
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              disabled={isCreateDisabled}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Create Category
            </Button>
          </span>
        </Tooltip>
      </Box>
      {isCreateDisabled && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Create is temporarily disabled while loading data.
        </Typography>
      )}

      {loadingCategories ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </Box>
      ) : categories.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            No categories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first category to organize manga in your library.
          </Typography>
          <Button variant="contained" onClick={openCreateDialog} disabled={isCreateDisabled}>
            Create Category
          </Button>
        </Box>
      ) : (
        <List sx={{ maxHeight: { md: 620 }, overflowY: 'auto' }}>
          {categories.map((category) => (
            <React.Fragment key={category.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory?.id === category.id}
                  onClick={() => {
                    setSelectedCategory(category);
                    loadCategoryManga(category.id);
                  }}
                  sx={{
                    borderRadius: 1,
                    borderLeft: '3px solid transparent',
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      borderLeftColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemText primary={category.name} />
                </ListItemButton>
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(category);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );

  const categoryDetail = (
    <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', minHeight: 420 }}>
      {selectedCategory ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCompact && (
                <IconButton size="small" onClick={() => setSelectedCategory(null)}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <Chip label={selectedCategory.name} color="primary" size="small" sx={{ mr: 1 }} />
                Manga in Category
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {categoryManga.length} {categoryManga.length === 1 ? 'item' : 'items'}
            </Typography>
          </Box>

          {loadingManga ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={260} />
              ))}
            </Box>
          ) : categoryManga.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
              This category is empty. Add manga from your library to organize it.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(150px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(180px, 1fr))',
                  md: 'repeat(auto-fill, minmax(200px, 1fr))',
                },
              }}
            >
              {categoryManga.map((manga) => (
                <MangaCard
                  key={manga.id}
                  manga={manga}
                  mangaSource={(manga as any).source}
                  showStatusBadge={false}
                  showRemoveButton
                  onRemove={() => handleRemoveMangaFromCategory((manga as any).id)}
                  actionMode="auto"
                />
              ))}
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 360,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <LibraryBooksIcon sx={{ fontSize: 56, mb: 1.5, opacity: 0.5 }} />
          <Typography variant="h6">Select a category</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Choose a category to view and manage its manga.
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
        <LibraryBooksIcon />
        Library Organization
      </Typography>

      {isCompact ? (
        <Box>{selectedCategory ? categoryDetail : categoryList}</Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 2.5 }}>
          {categoryList}
          {categoryDetail}
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} aria-labelledby="category-dialog-title">
        <DialogTitle id="category-dialog-title">{dialogMode === 'create' ? 'Create New Category' : 'Edit Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            variant="outlined"
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={dialogMode === 'create' ? handleCreateCategory : handleEditCategory} disabled={saving || !categoryName.trim()}>
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CategoriesPage;
