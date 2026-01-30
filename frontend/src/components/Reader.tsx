import React, { useState, useEffect } from 'react';
import { Chapter, Manga } from '../types';
import { ChevronLeft, Menu, Settings, X } from 'lucide-react';
import { explainChapter } from '../services/geminiService';

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
      
      // Hide controls on scroll
      setShowControls(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Optional: Auto show controls when stopped scrolling? No, better to keep hidden until click/hover
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      // Get AI Teaser
      explainChapter(chapter.title, manga.title).then(setTeaser);
  }, [chapter, manga]);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-800 z-50">
        <div 
          className="h-full bg-indigo-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <div 
        className={`fixed top-0 left-0 w-full bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-zinc-300 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div>
                <h2 className="text-sm font-bold text-zinc-200 hidden md:block">{manga.title}</h2>
                <p className="text-xs text-zinc-400">Chapter {chapter.number}: {chapter.title}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white">
                <Settings className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Click zones for controls */}
      <div 
        className="fixed inset-0 z-30 flex"
        onClick={() => setShowControls(!showControls)}
      >
         {/* Center click toggles controls, side clicks could advance but standard webtoon is scroll */}
      </div>

      {/* Pages */}
      <div className="max-w-3xl mx-auto z-10 relative pt-16 pb-32 min-h-screen bg-zinc-950 shadow-2xl">
        <div className="mb-8 px-4 text-center">
             <span className="inline-block px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-400 text-xs font-medium border border-indigo-900/50">
                AI Intro
             </span>
             <p className="mt-2 text-zinc-500 italic text-sm max-w-md mx-auto">
                 "{teaser}"
             </p>
        </div>

        {chapter.pages.map((url, idx) => (
          <img 
            key={idx}
            src={url}
            alt={`Page ${idx + 1}`}
            className="w-full h-auto block mb-2"
            loading="lazy"
          />
        ))}

        {/* Navigation Footer */}
        <div className="mt-12 px-4 py-8 flex flex-col items-center gap-4 border-t border-zinc-800">
            <p className="text-zinc-500">End of Chapter {chapter.number}</p>
            <div className="flex gap-4 w-full max-w-md">
                <button 
                    onClick={(e) => { e.stopPropagation(); onPrevChapter(); }}
                    disabled={!hasPrev}
                    className="flex-1 py-3 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    Previous
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onNextChapter(); }}
                    disabled={!hasNext}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    Next Chapter
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};