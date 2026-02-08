import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Manga } from '../types';
import { Star, BookOpen } from 'lucide-react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';

interface MangaCardProps {
    manga: Manga;
    isFavorite?: boolean;
    toggleFavorite?: (e: React.MouseEvent, id: string) => void;
    onRemove?: () => void;
    showRemoveButton?: boolean;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, isFavorite, toggleFavorite, onRemove, showRemoveButton }) => {
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
                    '& .overlay': { opacity: 1 },
                    '& .cover-img': { transform: 'scale(1.1)' },
                },
            }}
        >
            <Box
                sx={{
                    aspectRatio: '2/3',
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: '#3f3f46',
                    mb: 1.5,
                    position: 'relative',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
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
                        transition: 'transform 0.5s ease',
                    }}
                    loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <Box
                    className="overlay"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: 1.5,
                    }}
                >
                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: '#4f46e5',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                            }}
                         >
                            <Box sx={{ width: 12, height: 12 }}><BookOpen /></Box>
                            Read
                         </Box>
                         
                          {toggleFavorite && (
                              <IconButton
                                 onClick={(e) => toggleFavorite(e, manga.id)}
                                 sx={{
                                     p: 1,
                                     borderRadius: '50%',
                                     bgcolor: isFavorite ? '#eab308' : 'rgba(255,255,255,0.1)',
                                     backdropFilter: 'blur(8px)',
                                     transition: 'colors 0.2s ease',
                                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                                     color: isFavorite ? '#000' : '#fff',
                                     '&:hover': { bgcolor: isFavorite ? '#facc15' : 'rgba(255,255,255,0.2)' },
                                 }}
                              >
                                  <Box sx={{ width: 16, height: 16, fill: isFavorite ? 'currentColor' : 'none' }}>
                                    <Star />
                                  </Box>
                              </IconButton>
                          )}
                          {showRemoveButton && onRemove && (
                              <IconButton
                                  onClick={onRemove}
                                  sx={{
                                      p: 1,
                                      borderRadius: '50%',
                                      bgcolor: 'rgba(239, 68, 68, 0.3)',
                                      backdropFilter: 'blur(8px)',
                                      transition: 'colors 0.2s ease',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                                      color: '#ef4444',
                                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.5)' },
                                  }}
                              >
                                  <Box sx={{ width: 16, height: 16 }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                  </Box>
                              </IconButton>
                          )}
                     </Box>
                </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                 <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: '#e4e4e7',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                    lineHeight: 1.3,
                    '&:hover': { color: '#818cf8' },
                }}>
                    {manga.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                        {manga.genres[0]}
                    </Typography>
                    <Box
                        sx={{
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                            bgcolor: manga.status === 'Ongoing' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                            color: manga.status === 'Ongoing' ? '#4ade80' : '#60a5fa',
                            fontSize: '0.625rem',
                            fontWeight: 500,
                        }}
                    >
                        {manga.status}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
