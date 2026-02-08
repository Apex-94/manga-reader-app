import React, { useState, useEffect } from 'react';
import { Chapter, Manga } from '../types';
import { ChevronLeft, Menu, Settings, X } from 'lucide-react';
import { explainChapter } from '../services/geminiService';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Fade,
} from '@mui/material';

interface ReaderProps {
  manga: Manga;
  chapter: Chapter;
  onClose: () => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const Reader: React.FC<ReaderProps> = ({
  manga,
  chapter,
  onClose,
  onNextChapter,
  onPrevChapter,
  hasPrev,
  hasNext
}) => {
  const [showControls, setShowControls] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [teaser, setTeaser] = useState<string>('');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      setShowControls(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    explainChapter(chapter.title, manga.title).then(setTeaser);
  }, [chapter, manga]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', position: 'relative' }}>
      {/* Progress Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 4,
          bgcolor: '#3f3f46',
          zIndex: 50,
        }}
      >
        <Box
          sx={{
            height: '100%',
            bgcolor: '#6366f1',
            transition: 'width 0.15s ease-in-out',
            width: `${scrollProgress}%`,
          }}
        />
      </Box>

      {/* Top Bar */}
      <Fade in={showControls}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={onClose}
              sx={{ color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box sx={{ width: 20, height: 20 }}><ChevronLeft /></Box>
              Back
            </Button>
            <Box>
              <Typography variant="body2" sx={{ color: '#e4e4e7', display: { xs: 'none', md: 'block' } }}>
                {manga.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
                Chapter {chapter.number}: {chapter.title}
              </Typography>
            </Box>
          </Box>
          <IconButton sx={{ color: '#a1a1aa' }}>
            <Box sx={{ width: 20, height: 20 }}><Settings /></Box>
          </IconButton>
        </Box>
      </Fade>

      {/* Click zones for controls */}
 <Box
   sx={{
     position: 'fixed',
     inset: 0,
     zIndex: 30,
   }}
   onClick={() => setShowControls(!showControls)}
 />

      {/* Pages */}
      <Box
        sx={{
          maxWidth: '48rem',
          mx: 'auto',
          position: 'relative',
          zIndex: 10,
          pt: 8,
          pb: 16,
          minHeight: '100vh',
          bgcolor: '#09090b',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box sx={{ mb: 4, px: 2, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-block',
              px: 1.5,
              py: 0.5,
              borderRadius: 9999,
              bgcolor: 'rgba(49, 46, 129, 0.3)',
              color: '#818cf8',
              fontSize: '0.75rem',
              fontWeight: 500,
              border: '1px solid rgba(49, 46, 129, 0.5)',
            }}
          >
            AI Intro
          </Box>
          <Typography sx={{ mt: 1, color: '#71717a', fontStyle: 'italic', fontSize: '0.875rem', maxWidth: '28rem', mx: 'auto' }}>
            "{teaser}"
          </Typography>
        </Box>

        {chapter.pages.map((url, idx) => (
          <Box
            key={idx}
            component="img"
            src={url}
            alt={`Page ${idx + 1}`}
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
              mb: 1,
            }}
            loading="lazy"
          />
        ))}

        {/* Navigation Footer */}
        <Box sx={{ mt: 6, px: 2, py: 4, borderTop: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: '#71717a' }}>
            End of Chapter {chapter.number}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: '28rem' }}>
            <Button
              onClick={(e) => { e.stopPropagation(); onPrevChapter(); }}
              disabled={!hasPrev}
              sx={{
                flex: 1,
                py: 1.5,
                bgcolor: '#3f3f46',
                color: '#e4e4e7',
                '&:hover': { bgcolor: '#52525b' },
                '&.Mui-disabled': { opacity: 0.5, cursor: 'not-allowed' },
                fontWeight: 500,
              }}
            >
              Previous
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); onNextChapter(); }}
              disabled={!hasNext}
              sx={{
                flex: 1,
                py: 1.5,
                bgcolor: '#4f46e5',
                color: '#fff',
                '&:hover': { bgcolor: '#6366f1' },
                '&.Mui-disabled': { opacity: 0.5, cursor: 'not-allowed' },
                fontWeight: 500,
              }}
            >
              Next Chapter
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
