import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMangaToCategory,
  createCategory,
  getCategories,
  getCategoryManga,
  removeMangaFromCategory,
} from '../lib/api';

interface SetCategoriesPickerProps {
  open: boolean;
  mangaId?: number;
  mangaTitle?: string;
  onClose: () => void;
}

export default function SetCategoriesPicker({
  open,
  mangaId,
  mangaTitle,
  onClose,
}: SetCategoriesPickerProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [initialIds, setInitialIds] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: open,
  });

  useEffect(() => {
    if (!open || !mangaId || !categoriesQuery.data?.length) {
      setSelectedIds([]);
      setInitialIds([]);
      return;
    }

    let cancelled = false;
    const loadSelections = async () => {
      const categoryLists = await Promise.all(
        categoriesQuery.data.map(async (cat) => {
          const manga = await getCategoryManga(cat.id);
          const hasManga = manga.some((m: any) => m.id === mangaId);
          return hasManga ? cat.id : null;
        }),
      );

      if (cancelled) return;
      const ids = categoryLists.filter((id): id is number => id !== null);
      setSelectedIds(ids);
      setInitialIds(ids);
    };

    loadSelections();
    return () => {
      cancelled = true;
    };
  }, [categoriesQuery.data, mangaId, open]);

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => createCategory(name),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedIds((prev) => [...new Set([...prev, created.id])]);
      setNewCategoryName('');
    },
  });

  const onToggleCategory = (id: number) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    ));
  };

  const hasChanges = useMemo(() => {
    const a = [...selectedIds].sort((x, y) => x - y).join(',');
    const b = [...initialIds].sort((x, y) => x - y).join(',');
    return a !== b;
  }, [initialIds, selectedIds]);

  const onSave = async () => {
    if (!mangaId) return;
    setSaving(true);
    try {
      const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
      const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

      await Promise.all([
        ...toAdd.map((id) => addMangaToCategory(id, mangaId)),
        ...toRemove.map((id) => removeMangaFromCategory(id, mangaId)),
      ]);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Set Categories</DialogTitle>
      <DialogContent dividers>
        {mangaTitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {mangaTitle}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Create category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button
            variant="contained"
            disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
            onClick={() => createCategoryMutation.mutate(newCategoryName.trim())}
          >
            Add
          </Button>
        </Stack>

        {categoriesQuery.isLoading ? (
          <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {categoriesQuery.data.map((category) => (
              <FormControlLabel
                key={category.id}
                control={(
                  <Checkbox
                    checked={selectedIds.includes(category.id)}
                    onChange={() => onToggleCategory(category.id)}
                  />
                )}
                label={(
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{category.name}</Typography>
                    {selectedIds.includes(category.id) && <Chip size="small" label="Selected" color="primary" />}
                  </Box>
                )}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No categories yet. Create one above to organize this manga.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!hasChanges || saving || !mangaId}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
