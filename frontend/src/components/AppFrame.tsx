import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BookOpen,
  Download,
  FolderOpen,
  History,
  Library,
  Menu as MenuIcon,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X as CloseIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useColorMode } from '../theme/ColorModeContext';
import { DRAWER_WIDTH, PAGE_PAD_X, PAGE_PAD_Y, RAIL_WIDTH, TOPBAR_HEIGHT } from '../constants/layout';

const menuItems = [
  { text: 'Browse', icon: BookOpen, path: '/browse' },
  { text: 'Library', icon: Library, path: '/library' },
  { text: 'Categories', icon: FolderOpen, path: '/categories' },
  { text: 'History', icon: History, path: '/history' },
  { text: 'Sources', icon: Search, path: '/sources' },
  { text: 'Downloads', icon: Download, path: '/downloads' },
  { text: 'Updates', icon: RefreshCw, path: '/updates' },
  { text: 'Settings', icon: Settings, path: '/settings' },
];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const location = useLocation();
  const navWidth = isMobile ? 0 : (isTablet ? RAIL_WIDTH : DRAWER_WIDTH);

  const handleDrawerToggle = () => {
    setMobileOpen((open) => !open);
  };

  const drawer = (
    <Box sx={{ p: isTablet ? 1 : 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        {!isTablet && (
          <Typography variant="h6" noWrap component="div">
            PyYomi
          </Typography>
        )}
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} aria-label="close navigation drawer">
            <CloseIcon size={20} />
          </IconButton>
        )}
      </Box>
      <List>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = location.pathname === item.path;

          if (isTablet) {
            return (
              <Tooltip title={item.text} placement="right" key={item.text}>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isSelected}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 44,
                      justifyContent: 'center',
                      px: 1,
                      borderLeft: '3px solid transparent',
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        borderLeftColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0 }}>
                      <Box sx={{ color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary }}>
                        <Icon size={20} />
                      </Box>
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          }

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isSelected}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: 'flex-start',
                  px: 1.5,
                  borderLeft: '3px solid transparent',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderLeftColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    },
                    '& .MuiListItemText-primary': {
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                  <Box
                    sx={{
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    <Icon size={20} />
                  </Box>
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="default"
        sx={{
          width: { sm: `calc(100% - ${navWidth}px)` },
          ml: { sm: `${navWidth}px` },
          color: mode === 'light' ? '#111827' : '#f3f4f6',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: `${TOPBAR_HEIGHT}px !important` }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open navigation drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, color: 'inherit' }}
            >
              <MenuIcon size={20} />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            {isMobile && (
              <Typography variant="h6" noWrap component="div">
                PyYomi
              </Typography>
            )}
          </Box>
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{ ml: 1 }}
            aria-label="toggle color mode"
          >
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: navWidth }, flexShrink: { sm: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="persistent"
            open
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: navWidth, overflowX: 'hidden' },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${navWidth}px)` },
          height: '100vh',
          overflowY: 'auto',
          px: PAGE_PAD_X,
          pb: PAGE_PAD_Y,
          pt: `calc(${TOPBAR_HEIGHT}px + 16px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
