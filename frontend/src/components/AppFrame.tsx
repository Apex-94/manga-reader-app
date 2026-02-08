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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  BookOpen,
  Library,
  Settings,
  Download,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useColorMode } from '../theme/ColorModeContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Browse', icon: <BookOpen sx={{ width: 20, height: 20 }} />, path: '/browse' },
  { text: 'Library', icon: <Library sx={{ width: 20, height: 20 }} />, path: '/library' },
  { text: 'Sources', icon: <Settings sx={{ width: 20, height: 20 }} />, path: '/sources' },
  { text: 'Downloads', icon: <Download sx={{ width: 20, height: 20 }} />, path: '/downloads' },
  { text: 'Updates', icon: <RefreshCw sx={{ width: 20, height: 20 }} />, path: '/updates' },
  { text: 'Settings', icon: <Settings sx={{ width: 20, height: 20 }} />, path: '/settings' },
];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h6" noWrap component="div">
          PyYomi
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon sx={{ width: 20, height: 20 }} />
          </IconButton>
        )}
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.contrastText,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box sx={{ color: location.pathname === item.path ? 
                  theme.palette.primary.contrastText : 
                  theme.palette.text.secondary 
                }}>
                  {item.icon}
                </Box>
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="default"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          color: mode === 'light' ? '#111827' : '#f3f4f6',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: 'inherit' }}
            >
              <MenuIcon sx={{ width: 20, height: 20 }} />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            PyYomi
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{ ml: 1 }}
            aria-label="toggle color mode"
          >
            {mode === 'dark' ? (
              <Sun sx={{ width: 20, height: 20 }} />
            ) : (
              <Moon sx={{ width: 20, height: 20 }} />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="persistent"
            open
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
