import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, BookOpen } from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 w-full transition-all group relative ${active ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-500/10 scale-110' : 'group-hover:bg-zinc-800'}`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
        </div>
        <span className={`text-[10px] font-medium transition-opacity ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {label}
        </span>
        {active && <span className="absolute -right-2 top-3 w-1 h-1 rounded-full bg-indigo-400 md:block hidden" />}
    </button>
);

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed left-0 top-0 h-screen w-20 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-8 z-50 hidden md:flex">
            <div className="mb-12 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30 ring-1 ring-white/10">
                    <BookOpen className="text-white w-5 h-5" />
                </div>
            </div>
            
            <div className="flex flex-col gap-8 w-full px-2">
                <NavItem icon={<HomeIcon />} label="Home" active={isActive('/')} onClick={() => navigate('/')} />
                <NavItem icon={<Search />} label="Search" active={isActive('/search')} onClick={() => navigate('/search')} />
                <NavItem icon={<Library />} label="Library" active={isActive('/library')} onClick={() => navigate('/library')} />
            </div>
        </nav>
    );
};

export const MobileNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 flex justify-around py-4 z-50 md:hidden pb-safe">
             <NavItem icon={<HomeIcon />} label="Home" active={isActive('/')} onClick={() => navigate('/')} />
             <NavItem icon={<Search />} label="Search" active={isActive('/search')} onClick={() => navigate('/search')} />
             <NavItem icon={<Library />} label="Library" active={isActive('/library')} onClick={() => navigate('/library')} />
        </nav>
    );
};