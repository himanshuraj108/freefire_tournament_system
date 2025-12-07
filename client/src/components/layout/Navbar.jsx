import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, User, Search, LogOut, Settings as SettingsIcon } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    return (
        <nav className="h-16 fixed top-0 left-0 right-0 z-50 glass flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Menu className="text-white w-6 h-6" />
                </button>
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-neon-blue">
                        RYL <span className="text-white not-italic">GAMING</span>
                    </span>
                </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search tournaments, videos..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-4 pr-10 text-white focus:outline-none focus:border-neon-red/50 focus:ring-1 focus:ring-neon-red/50 transition-all placeholder:text-zinc-500"
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
                            <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors" title="Logout">
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
