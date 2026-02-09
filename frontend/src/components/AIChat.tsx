import React, { useState, useRef, useEffect } from 'react';
import { Message, Manga } from '../types';
import { generateMangaRecommendation } from '../services/geminiService';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
  Fade,
  CircularProgress,
} from '@mui/material';

interface AIChatProps {
  availableManga: Manga[];
}

export const AIChat: React.FC<AIChatProps> = ({ availableManga }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hi! I'm your Manga Guru. Tell me what you're in the mood for (e.g., 'Action with swords' or 'Funny romance'), and I'll recommend something from our library!",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateMangaRecommendation(input, availableManga);

    const modelMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            p: 2,
            borderRadius: '50%',
            bgcolor: '#4f46e5',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)',
            transition: 'all 0.2s ease',
            zIndex: 50,
            minWidth: 'auto',
            '&:hover': {
              bgcolor: '#6366f1',
              transform: 'scale(1.1)',
            },
          }}
        >
          <Box sx={{ width: 24, height: 24 }}><Sparkles /></Box>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: '100%', md: 384 },
            maxWidth: 350,
            height: 500,
            bgcolor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            bgcolor: '#27272a',
            borderBottom: '1px solid #3f3f46',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(to bottom right, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
              >
                <Box sx={{ width: 16, height: 16, color: '#fff' }}><Sparkles /></Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>
                  Manga Guru AI
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <Typography variant="caption" sx={{ color: '#4ade80', fontSize: '0.75rem' }}>
                    Online
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton
              onClick={() => setIsOpen(false)}
              sx={{
                color: '#a1a1aa',
                '&:hover': { color: '#fff', bgcolor: '#3f3f46' },
              }}
            >
              <Box sx={{ width: 20, height: 20 }}><X /></Box>
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'rgba(24, 24, 27, 0.95)',
          }}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    p: 1.5,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    bgcolor: msg.role === 'user'
                      ? '#4f46e5'
                      : '#3f3f46',
                    color: msg.role === 'user' ? '#fff' : '#e4e4e7',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                    border: msg.role === 'model' ? '1px solid #3f3f46' : 'none',
                  }}
                >
                  {msg.content}
                </Box>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Box sx={{
                    bgcolor: '#3f3f46',
                    p: 1.5,
                    borderRadius: 2,
                    borderBottomLeftRadius: 4,
                    border: '1px solid #3f3f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}>
                  <CircularProgress size={16} sx={{ color: '#818cf8', animationDuration: '1s' }} />
                  <Typography variant="caption" sx={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    Thinking...
                  </Typography>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{
            p: 1.5,
            bgcolor: '#27272a',
            borderTop: '1px solid #3f3f46',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for recommendations..."
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#18181b',
                    color: '#fff',
                    borderRadius: 2,
                    '& fieldset': { borderColor: '#3f3f46' },
                    '&:hover fieldset': { borderColor: '#52525b' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#71717a' },
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#4f46e5',
                  color: '#fff',
                  minWidth: 'auto',
                  '&:hover': { bgcolor: '#6366f1' },
                  '&.Mui-disabled': { opacity: 0.5, cursor: 'not-allowed' },
                }}
              >
                <Box sx={{ width: 16, height: 16 }}><Send /></Box>
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};
