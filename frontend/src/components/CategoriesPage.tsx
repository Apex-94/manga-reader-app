import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Grid,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryManga, removeMangaFromCategory } from '../lib/api';
import { Category } from '../types';
import { MangaCard } from './MangaCard';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryManga, setCategoryManga] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load categories',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryManga = async (categoryId: number) => {
    setLoading(true);
    try {
      const data = await getCategoryManga(categoryId);
      setCategoryManga(data);
    } catch (error) {
      console.error('Error loading category manga:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load category manga',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;

    setLoading(true);
    try {
      await createCategory(categoryName.trim());
      setSnackbar({
        open: true,
        message: 'Category created successfully',
        severity: 'success'
      });
      setOpenDialog(false);
      setCategoryName('');
      loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create category',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) return;

    setLoading(true);
    try {
      await updateCategory(selectedCategory.id, categoryName.trim());
      setSnackbar({
        open: true,
        message: 'Category updated successfully',
        severity: 'success'
      });
      setOpenDialog(false);
      setCategoryName('');
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update category',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    try {
      await deleteCategory(categoryId);
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
        setCategoryManga([]);
      }
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete category',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMangaFromCategory = async (mangaId: number) => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      await removeMangaFromCategory(selectedCategory.id, mangaId);
      setSnackbar({
        open: true,
        message: 'Manga removed from category',
        severity: 'success'
      });
      loadCategoryManga(selectedCategory.id);
    } catch (error) {
      console.error('Error removing manga from category:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove manga from category',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LibraryBooksIcon />
        Library Organization
      </Typography>

      <Grid container spacing={3}>
        {/* Categories List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Categories</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                disabled={loading}
              >
                Create Category
              </Button>
            </Box>

            {loading && !categories.length ? (
              <Typography variant="body2" color="text.secondary">
                Loading categories...
              </Typography>
            ) : categories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ italic: true }}>
                No categories created yet. Create your first category to organize your manga library.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {categories.map((category) => (
                  <React.Fragment key={category.id}>
                    <ListItem
                      selected={selectedCategory?.id === category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        loadCategoryManga(category.id);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark'
                          },
                          '& .MuiListItemText-primary': {
                            color: 'white'
                          }
                        }
                      }}
                    >
                      <ListItemText primary={category.name} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(category);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="fullWidth" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Category Manga */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            {selectedCategory ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    <Chip label={selectedCategory.name} color="primary" size="small" sx={{ mr: 1 }} />
                    Manga in Category
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {categoryManga.length} {categoryManga.length === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>

                {loading ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading manga...
                  </Typography>
                ) : categoryManga.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ italic: true }}>
                    This category is empty. Add manga to organize your library.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {categoryManga.map((manga) => (
                      <Grid item xs={6} sm={4} md={3} key={manga.id}>
                        <MangaCard
                          manga={manga}
                          onRemove={() => handleRemoveMangaFromCategory(manga.id)}
                          showRemoveButton
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                <LibraryBooksIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">Select a category</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Choose a category from the list to view and manage its contents
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create/Edit Category Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="category-dialog-title"
      >
        <DialogTitle id="category-dialog-title">
          {dialogMode === 'create' ? 'Create New Category' : 'Edit Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            variant="outlined"
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={dialogMode === 'create' ? handleCreateCategory : handleEditCategory}
            disabled={loading || !categoryName.trim()}
          >
            {dialogMode === 'create' ? 'Create' : 'Save'}
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

export default CategoriesPage;
