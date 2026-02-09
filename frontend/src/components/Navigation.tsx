import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, BookOpen, Folder, History } from 'lucide-react';
import {
  Box,
  Button,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  const theme = useTheme();

  return (
    <Button
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        width: '100%',
        transition: 'all 0.2s ease',
        position: 'relative',
        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
        '&:hover': {
          color: theme.palette.text.primary,
        },
      }}
    >
      <Box sx={{
        p: 1,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        bgcolor: active ? `${theme.palette.primary.main}20` : 'transparent',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        '&:hover': {
          bgcolor: theme.palette.action.hover,
        },
      }}>
        <Box sx={{ width: 24, height: 24 }}>
          {React.cloneElement(icon as React.ReactElement, {})}
        </Box>
      </Box>
      <Typography variant="caption" sx={{
        fontSize: '0.625rem',
        fontWeight: 500,
        opacity: active ? 1 : 0.7,
        transition: 'opacity 0.2s ease',
        '&:hover': {
          opacity: 1,
        },
      }}>
        {label}
      </Typography>
      {active && (
        <Box sx={{
          position: 'absolute',
          right: -8,
          top: 12,
          width: 4,
          height: 4,
          borderRadius: '50%',
          bgcolor: theme.palette.primary.main,
          display: { md: 'block', xs: 'none' },
        }} />
      )}
    </Button>
  );
};

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const theme = useTheme();

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                left: 0,
                top: 0,
                height: '100vh',
                width: 80,
                bgcolor: theme.palette.background.paper,
                borderRight: 1,
                borderColor: theme.palette.divider,
                display: { md: 'flex', xs: 'none' },
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                zIndex: 50,
            }}
        >
            <Box
                sx={{
                    mb: 3,
                    cursor: 'pointer',
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                    border: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onClick={() => navigate('/')}
            >
                <Box sx={{ width: 20, height: 20, color: '#fff' }}>
                  <BookOpen />
                </Box>
            </Box>
            
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                px: 0.5,
            }}>
                <NavItem icon={<HomeIcon />} label="Home" active={isActive('/')} onClick={() => navigate('/')} />
                <NavItem icon={<Search />} label="Search" active={isActive('/search')} onClick={() => navigate('/search')} />
                <NavItem icon={<Library />} label="Library" active={isActive('/library')} onClick={() => navigate('/library')} />
                <NavItem icon={<Folder />} label="Categories" active={isActive('/categories')} onClick={() => navigate('/categories')} />
                <NavItem icon={<History />} label="History" active={isActive('/history')} onClick={() => navigate('/history')} />
            </Box>
        </Paper>
     );
};

export const MobileNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const theme = useTheme();

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                bgcolor: `${theme.palette.background.paper}e5`,
                backdropFilter: 'blur(12px)',
                borderTop: 1,
                borderColor: theme.palette.divider,
                display: { md: 'none', xs: 'flex' },
                justifyContent: 'space-around',
                alignItems: 'center',
                py: 1,
                zIndex: 50,
            }}
        >
             <NavItem icon={<HomeIcon />} label="Home" active={isActive('/')} onClick={() => navigate('/')} />
             <NavItem icon={<Search />} label="Search" active={isActive('/search')} onClick={() => navigate('/search')} />
             <NavItem icon={<Library />} label="Library" active={isActive('/library')} onClick={() => navigate('/library')} />
             <NavItem icon={<Folder />} label="Categories" active={isActive('/categories')} onClick={() => navigate('/categories')} />
             <NavItem icon={<History />} label="History" active={isActive('/history')} onClick={() => navigate('/history')} />
        </Paper>
    );
};
