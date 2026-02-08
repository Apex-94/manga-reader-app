import React from 'react';
import { ReadingMode, ZoomMode, ReaderSettings } from '../types';
import { 
  Layout, 
  Maximize, 
  Minimize, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  FileText,
  Grid3X3
} from 'lucide-react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Slider,
  Paper,
  Fade,
} from '@mui/material';

interface ReaderControlsProps {
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  showControls: boolean;
  onToggleControls: () => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  settings,
  onSettingsChange,
  currentPage,
  totalPages,
  onPageChange,
  onClose,
  hasPrevChapter,
  hasNextChapter,
  onPrevChapter,
  onNextChapter,
  showControls,
  onToggleControls,
}) => {
  const [modeAnchor, setModeAnchor] = React.useState<null | HTMLElement>(null);
  const [zoomAnchor, setZoomAnchor] = React.useState<null | HTMLElement>(null);
  const [settingsAnchor, setSettingsAnchor] = React.useState<null | HTMLElement>(null);

  const handleReadingModeChange = (mode: ReadingMode) => {
    onSettingsChange({ ...settings, readingMode: mode });
    setModeAnchor(null);
  };

  const handleZoomModeChange = (mode: ZoomMode) => {
    onSettingsChange({ ...settings, zoomMode: mode });
    setZoomAnchor(null);
  };

  const handleCustomZoomChange = (_event: Event, newValue: number | number[]) => {
    const zoom = newValue as number;
    onSettingsChange({ ...settings, customZoom: zoom, zoomMode: 'CUSTOM' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    } else if (hasPrevChapter) {
      onPrevChapter();
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    } else if (hasNextChapter) {
      onNextChapter();
    }
  };

  const readingModeIcon = (mode: ReadingMode) => {
    switch (mode) {
      case 'VERTICAL':
        return <Layout size={20} />;
      case 'SINGLE':
        return <FileText size={20} />;
      case 'DOUBLE':
        return <BookOpen size={20} />;
    }
  };

  const readingModeLabel = (mode: ReadingMode) => {
    switch (mode) {
      case 'VERTICAL':
        return 'Vertical';
      case 'SINGLE':
        return 'Single Page';
      case 'DOUBLE':
        return 'Double Page';
    }
  };

  const zoomModeIcon = (mode: ZoomMode) => {
    switch (mode) {
      case 'FIT_WIDTH':
        return <Grid3X3 size={20} />;
      case 'FIT_HEIGHT':
        return <Grid3X3 size={20} />;
      case 'CUSTOM':
        return <Maximize size={20} />;
    }
  };

  const zoomModeLabel = (mode: ZoomMode) => {
    switch (mode) {
      case 'FIT_WIDTH':
        return 'Fit Width';
      case 'FIT_HEIGHT':
        return 'Fit Height';
      case 'CUSTOM':
        return `${settings.customZoom}%`;
    }
  };

  return (
    <>
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
            width: `${(currentPage / totalPages) * 100}%`,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: '#e4e4e7' }}>
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Reading Mode Menu */}
            <div>
              <IconButton
                onClick={(e) => setModeAnchor(e.currentTarget)}
                sx={{ color: '#a1a1aa' }}
              >
                {readingModeIcon(settings.readingMode)}
              </IconButton>
              <Menu
                anchorEl={modeAnchor}
                open={Boolean(modeAnchor)}
                onClose={() => setModeAnchor(null)}
                PaperProps={{
                  sx: {
                    bgcolor: '#18181b',
                    border: '1px solid #3f3f46',
                    color: '#e4e4e7',
                  },
                }}
              >
                {(['VERTICAL', 'SINGLE', 'DOUBLE'] as ReadingMode[]).map((mode) => (
                  <MenuItem
                    key={mode}
                    onClick={() => handleReadingModeChange(mode)}
                    selected={settings.readingMode === mode}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: '#3f3f46',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {readingModeIcon(mode)}
                      <Typography>{readingModeLabel(mode)}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </div>

            {/* Zoom Menu */}
            <div>
              <IconButton
                onClick={(e) => setZoomAnchor(e.currentTarget)}
                sx={{ color: '#a1a1aa' }}
              >
                {zoomModeIcon(settings.zoomMode)}
              </IconButton>
              <Menu
                anchorEl={zoomAnchor}
                open={Boolean(zoomAnchor)}
                onClose={() => setZoomAnchor(null)}
                PaperProps={{
                  sx: {
                    bgcolor: '#18181b',
                    border: '1px solid #3f3f46',
                    color: '#e4e4e7',
                    minWidth: 200,
                    p: 1,
                  },
                }}
              >
                <Box sx={{ mb: 1 }}>
                  {(['FIT_WIDTH', 'FIT_HEIGHT'] as ZoomMode[]).map((mode) => (
                    <MenuItem
                      key={mode}
                      onClick={() => handleZoomModeChange(mode)}
                      selected={settings.zoomMode === mode}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: '#3f3f46',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {zoomModeIcon(mode)}
                        <Typography>{zoomModeLabel(mode)}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>

                <Box sx={{ borderTop: '1px solid #3f3f46', pt: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa', mb: 1 }}>
                    Custom Zoom
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={settings.customZoom}
                      onChange={handleCustomZoomChange}
                      min={50}
                      max={200}
                      step={10}
                      sx={{
                        color: '#6366f1',
                        '& .MuiSlider-thumb': {
                          bgcolor: '#6366f1',
                        },
                        '& .MuiSlider-track': {
                          bgcolor: '#6366f1',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a1a1aa' }}>
                      <Typography>50%</Typography>
                      <Typography>200%</Typography>
                    </Box>
                  </Box>
                </Box>
              </Menu>
            </div>

            {/* Settings Menu */}
            <div>
              <IconButton
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
                sx={{ color: '#a1a1aa' }}
              >
                <Settings size={20} />
              </IconButton>
              <Menu
                anchorEl={settingsAnchor}
                open={Boolean(settingsAnchor)}
                onClose={() => setSettingsAnchor(null)}
                PaperProps={{
                  sx: {
                    bgcolor: '#18181b',
                    border: '1px solid #3f3f46',
                    color: '#e4e4e7',
                    minWidth: 250,
                  },
                }}
              >
                <MenuItem
                  onClick={() => onSettingsChange({ ...settings, showPageNumbers: !settings.showPageNumbers })}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: '#3f3f46',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                    <Typography>Show Page Numbers</Typography>
                    <Typography sx={{ color: settings.showPageNumbers ? '#6366f1' : '#71717a' }}>
                      {settings.showPageNumbers ? 'ON' : 'OFF'}
                    </Typography>
                  </Box>
                </MenuItem>

                <MenuItem
                  onClick={() => onSettingsChange({ ...settings, showProgress: !settings.showProgress })}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: '#3f3f46',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                    <Typography>Show Progress Bar</Typography>
                    <Typography sx={{ color: settings.showProgress ? '#6366f1' : '#71717a' }}>
                      {settings.showProgress ? 'ON' : 'OFF'}
                    </Typography>
                  </Box>
                </MenuItem>
              </Menu>
            </div>
          </Box>
        </Box>
      </Fade>

      {/* Bottom Bar */}
      <Fade in={showControls}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid #3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 && !hasPrevChapter}
              sx={{
                color: '#d4d4d8',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&.Mui-disabled': {
                  color: '#52525b',
                },
              }}
            >
              <ChevronLeft size={20} />
              <Typography>Prev</Typography>
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages && !hasNextChapter}
              sx={{
                color: '#d4d4d8',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&.Mui-disabled': {
                  color: '#52525b',
                },
              }}
            >
              <Typography>Next</Typography>
              <ChevronRight size={20} />
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Click zones for controls */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
        }}
        onClick={onToggleControls}
      />
    </>
  );
};