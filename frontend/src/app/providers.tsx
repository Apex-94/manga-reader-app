import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeProvider, useColorMode } from "../theme/ColorModeContext";
import { createTheme } from '@mui/material/styles';

function ThemedApp({ children }: { children: React.ReactNode }) {
    const { mode } = useColorMode();
    
    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#4f46e5' : '#818cf8', // Indigo
            },
            secondary: {
                main: mode === 'light' ? '#6366f1' : '#818cf8', // Indigo
            },
            background: {
                default: mode === 'light' ? '#f9fafb' : '#111827', // gray-50 / gray-900
                paper: mode === 'light' ? '#ffffff' : '#1f2937', // white / gray-800
            },
            text: {
                primary: mode === 'light' ? '#111827' : '#f3f4f6', // gray-900 / gray-100
                secondary: mode === 'light' ? '#6b7280' : '#d1d5db', // gray-600 / gray-300
            },
            divider: mode === 'light' ? '#e5e7eb' : '#374151', // gray-200 / gray-700
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderBottom: mode === 'light' ? '1px solid #e5e7eb' : '1px solid #374151',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: mode === 'light' ? '#ffffff' : '#1f2937',
                        borderRight: mode === 'light' ? '1px solid #e5e7eb' : '1px solid #374151',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                    },
                },
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                staleTime: 1000 * 60 * 5, // 5 minutes
            }
        }
    }));

    return (
        <ColorModeProvider>
            <ThemedApp>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </ThemedApp>
        </ColorModeProvider>
    );
}