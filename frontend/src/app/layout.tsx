import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Providers } from "./providers";
import { BookOpen, Library, Settings, Moon, Sun } from "lucide-react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark', dark.toString());
  }, [dark]);

  return (
    <Providers>
      <nav className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/browse" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center">
            <BookOpen className="w-6 h-6 mr-2" />
            PyYomi
          </Link>
          <div className="flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-300 items-center">
            <Link to="/browse" className={`flex items-center hover:text-blue-600 transition-colors ${location.pathname === '/browse' ? 'text-blue-600' : ''}`}>
              <BookOpen className="w-4 h-4 mr-1" />
              Browse
            </Link>
            <Link to="/library" className={`flex items-center hover:text-blue-600 transition-colors ${location.pathname === '/library' ? 'text-blue-600' : ''}`}>
              <Library className="w-4 h-4 mr-1" />
              Library
            </Link>
            <Link to="/sources" className={`flex items-center hover:text-blue-600 transition-colors ${location.pathname === '/sources' ? 'text-blue-600' : ''}`}>
              <Settings className="w-4 h-4 mr-1" />
              Sources
            </Link>
            <button onClick={() => setDark(!dark)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 min-h-[calc(100vh-64px)]">
        {children}
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        PyYomi - Built with React & FastAPI
      </footer>
    </Providers>
  );
}