import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Manga } from '../types';
import { Star, BookOpen, Plus } from 'lucide-react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';

interface MangaCardProps {
    manga: Manga;
    isFavorite?: boolean;
    toggleFavorite?: (e: React.MouseEvent, id: string) => void;
    onAddToLibrary?: (e: React.MouseEvent, id: string) => void;
    onRemove?: () => void;
    showRemoveButton?: boolean;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, isFavorite, toggleFavorite, onAddToLibrary, onRemove, showRemoveButton }) => {
    const navigate = useNavigate();
    
    return (
        <Box
            onClick={() => navigate(`/manga?url=${encodeURIComponent(manga.id)}`)}
            sx={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                '&:hover': {
                    '& .cover-img': { transform: 'scale(1.05)' },
                },
            }}
        >
            {/* Cover Image */}
            <Box
                sx={{
                    aspectRatio: '2/3',
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: '#2d2d35',
                    mb: 1.25,
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
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
                
                {/* Status Badge */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        px: 1,
                        py: 0.375,
                        borderRadius: 1,
                        bgcolor: manga.status === 'Ongoing' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                        color: '#fff',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                    }}
                >
                    {manga.status}
                </Box>
                
                {/* Action Buttons */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        right: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    {/* Read Button */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.25,
                            py: 0.625,
                            borderRadius: 1.5,
                            bgcolor: '#4f46e5',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.5)',
                            },
                        }}
                    >
                        <Box sx={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={14} strokeWidth={2.5} />
                        </Box>
                        Read
                    </Box>
                    
                    {/* Icon Buttons */}
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {onAddToLibrary && (
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onAddToLibrary(e, manga.id); }}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    color: '#fff',
                                    '&:hover': { 
                                        bgcolor: 'rgba(79, 70, 229, 0.9)',
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <Plus size={16} strokeWidth={2.5} />
                            </IconButton>
                        )}
                        {toggleFavorite && (
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(e, manga.id); }}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    bgcolor: isFavorite ? '#eab308' : 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    color: isFavorite ? '#000' : '#fff',
                                    '&:hover': { 
                                        bgcolor: isFavorite ? '#facc15' : 'rgba(79, 70, 229, 0.9)',
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <Star size={16} strokeWidth={2.5} fill={isFavorite ? 'currentColor' : 'none'} />
                            </IconButton>
                        )}
                        {showRemoveButton && onRemove && (
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(239, 68, 68, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    color: '#fff',
                                    '&:hover': { 
                                        bgcolor: 'rgba(239, 68, 68, 1)',
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </Box>
            
            {/* Text Content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.375 }}>
                 <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: '#f4f4f5',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                    lineHeight: 1.4,
                    letterSpacing: '-0.01em',
                    '&:hover': { color: '#a5b4fc' },
                }}>
                    {manga.title}
                 </Typography>
                 <Typography variant="caption" sx={{ 
                    color: '#71717a', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                 }}>
                     {manga.genres[0]}
                 </Typography>
            </Box>
        </Box>
    );
};
