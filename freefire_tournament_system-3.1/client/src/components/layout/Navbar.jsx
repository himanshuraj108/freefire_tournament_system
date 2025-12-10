import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, User, Search, LogOut, Settings as SettingsIcon, Youtube } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { searchQuery, setSearchQuery } = useSearch();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="h-16 fixed top-0 left-0 right-0 z-50 glass flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Menu className="text-white w-6 h-6" />
                </button>
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl font-black italic tracking-tighter text-white">
                        RYL
                    </span>
                </Link>
                <a
                    href="https://www.youtube.com/@r_y_l_shorts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 hover:scale-110 transition-transform flex items-center"
                    title="RYL Shorts Channel"
                >
                    {/* Inline SVG for Red Box + White Triangle */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="#FF0000" />
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                    </svg>
                </a>
            </div>


            <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search tournaments, videos..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-4 pr-10 text-white focus:outline-none focus:border-neon-red/50 focus:ring-1 focus:ring-neon-red/50 transition-all placeholder:text-zinc-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-3 top-2.5 text-zinc-400 w-5 h-5" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <button className="p-2 hover:bg-white/10 rounded-full relative">
                            <Bell className="w-6 h-6 text-white" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-neon-red rounded-full animate-pulse" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                                <p className="text-xs text-neon-blue font-mono">UID: {user.ffUid}</p>
                            </div>
                            <Link to="/profile">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform" title="My Profile">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-white" />
                                    )}
                                </div>
                            </Link>
                            <Link to="/settings" className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors" title="Settings">
                                <SettingsIcon className="w-5 h-5" />
                            </Link>
                            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="btn-primary flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Login</span>
                    </Link>
                )}
            </div>
        </nav >
    );
};

export default Navbar;
