import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Manga } from '../types';
import { Star, BookOpen } from 'lucide-react';

interface MangaCardProps {
    manga: Manga;
    isFavorite?: boolean;
    toggleFavorite?: (e: React.MouseEvent, id: string) => void;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, isFavorite, toggleFavorite }) => {
    const navigate = useNavigate();
    
    return (
        <div 
            onClick={() => navigate(`/manga/${manga.id}`)}
            className="group cursor-pointer relative flex flex-col h-full"
        >
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-800 mb-3 relative shadow-lg ring-1 ring-white/5 group-hover:ring-indigo-500/50 transition-all">
                <img 
                    src={manga.coverUrl} 
                    alt={manga.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                     <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white bg-indigo-600 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Read
                         </span>
                         
                         {toggleFavorite && (
                             <button 
                                onClick={(e) => toggleFavorite(e, manga.id)}
                                className={`p-2 rounded-full backdrop-blur-md transition-colors shadow-lg ${isFavorite ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                             >
                                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                             </button>
                         )}
                     </div>
                </div>
            </div>
            
            <div className="space-y-1">
                <h3 className="font-semibold text-zinc-100 truncate group-hover:text-indigo-400 transition-colors leading-tight">
                    {manga.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="truncate max-w-[60%]">{manga.genres[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded ${manga.status === 'Ongoing' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                        {manga.status}
                    </span>
                </div>
            </div>
        </div>
    );
};