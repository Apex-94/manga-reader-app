import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Manga } from '../types';
import { Star, BookOpen, Plus, MoreVertical, Trash2 } from 'lucide-react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';

export interface SecondaryAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface MangaCardProps {
  manga: Manga;
  mangaSource?: string;
  isFavorite?: boolean;
  toggleFavorite?: (e: React.MouseEvent, id: string) => void;
  onAddToLibrary?: (e: React.MouseEvent, id: string) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  actionMode?: 'overlay' | 'footer-menu' | 'auto';
  showStatusBadge?: boolean;
  secondaryActions?: SecondaryAction[];
}

export const MangaCard: React.FC<MangaCardProps> = ({
  manga,
  mangaSource,
  isFavorite,
  toggleFavorite,
  onAddToLibrary,
  onRemove,
  showRemoveButton,
  actionMode = 'auto',
  showStatusBadge = true,
  secondaryActions,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const resolvedActionMode = actionMode === 'auto' ? ((canHover && !isMobile) ? 'overlay' : 'footer-menu') : actionMode;

  const builtInActions = (() => {
    const actions: SecondaryAction[] = [];
    const syntheticEvent = {
      stopPropagation: () => {},
      preventDefault: () => {},
    } as React.MouseEvent;

    if (onAddToLibrary) {
      actions.push({
        id: 'add',
        label: 'Add to Library',
        icon: <Plus size={16} />,
        onClick: () => onAddToLibrary(syntheticEvent, manga.id),
      });
    }

    if (toggleFavorite) {
      actions.push({
        id: 'favorite',
        label: isFavorite ? 'Remove Favorite' : 'Add Favorite',
        icon: <Star size={16} />,
        onClick: () => toggleFavorite(syntheticEvent, manga.id),
      });
    }

    if (showRemoveButton && onRemove) {
      actions.push({
        id: 'remove',
        label: 'Remove',
        icon: <Trash2 size={16} />,
        onClick: onRemove,
        danger: true,
      });
    }

    return [...actions, ...(secondaryActions || [])];
  })();

  const openReader = () => {
    const params = new URLSearchParams({ url: manga.id });
    if (mangaSource) {
      params.set('source', mangaSource);
    }
    navigate(`/manga?${params.toString()}`);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuAnchor(null);
  };

  const runAction = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <Box
      onClick={openReader}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover .cover-img': { transform: 'scale(1.04)' },
        '&:hover .overlay-actions': {
          opacity: resolvedActionMode === 'overlay' ? 1 : undefined,
          transform: resolvedActionMode === 'overlay' ? 'translateY(0)' : undefined,
          pointerEvents: resolvedActionMode === 'overlay' ? 'auto' : undefined,
        },
      }}
    >
      <Box
        sx={{
          aspectRatio: '2/3',
          overflow: 'hidden',
          borderRadius: 2,
          mb: 1,
          position: 'relative',
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          component="img"
          src={manga.coverUrl}
          alt={manga.title}
          className="cover-img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
          loading="lazy"
        />

        {showStatusBadge && (
          <Box
            sx={{
              position: 'absolute',
              top: 1.5,
              right: 1.5,
              px: 1,
              py: 0.35,
              borderRadius: 1,
              bgcolor: manga.status === 'Ongoing' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              backdropFilter: 'blur(6px)',
            }}
          >
            {manga.status}
          </Box>
        )}

        {resolvedActionMode === 'overlay' && (
          <Box
            className="overlay-actions"
            sx={{
              position: 'absolute',
              left: 1.5,
              right: 1.5,
              bottom: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              opacity: 0,
              transform: 'translateY(6px)',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
            }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<BookOpen size={14} />}
              onClick={(e) => runAction(e, openReader)}
              sx={{
                minHeight: 32,
                px: 1.25,
                borderRadius: 1.25,
                boxShadow: 'none',
              }}
            >
              Read
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {onAddToLibrary && (
                <IconButton
                  size="small"
                  onClick={(e) => runAction(e, () => onAddToLibrary(e, manga.id))}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.main' },
                  }}
                >
                  <Plus size={16} />
                </IconButton>
              )}
              {toggleFavorite && (
                <IconButton
                  size="small"
                  onClick={(e) => runAction(e, () => toggleFavorite(e, manga.id))}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isFavorite ? 'warning.main' : 'rgba(0,0,0,0.55)',
                    color: isFavorite ? '#111827' : '#fff',
                    '&:hover': { bgcolor: isFavorite ? 'warning.light' : 'primary.main' },
                  }}
                >
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </IconButton>
              )}
              {showRemoveButton && onRemove && (
                <IconButton
                  size="small"
                  onClick={(e) => runAction(e, onRemove)}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(220,38,38,0.9)',
                    color: '#fff',
                    '&:hover': { bgcolor: '#dc2626' },
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {manga.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {manga.genres?.[0] || manga.author || 'Unknown'}
        </Typography>
      </Box>

      {resolvedActionMode === 'footer-menu' && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<BookOpen size={14} />}
            onClick={(e) => runAction(e, openReader)}
            sx={{ minHeight: 32, borderRadius: 1.25, px: 1.25 }}
          >
            Read
          </Button>

          {builtInActions.length > 0 && (
            <>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  width: 32,
                  height: 32,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <MoreVertical size={16} />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                {builtInActions.map((action) => (
                  <MenuItem
                    key={action.id}
                    onClick={(e) => {
                      runAction(e, action.onClick);
                      handleMenuClose();
                    }}
                    sx={action.danger ? { color: 'error.main' } : undefined}
                  >
                    {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
                    <ListItemText>{action.label}</ListItemText>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};
