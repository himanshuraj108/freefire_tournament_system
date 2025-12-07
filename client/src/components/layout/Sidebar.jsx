import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Video, Users, Crown, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { user } = useAuth();

    const links = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
        { icon: Video, label: 'Videos', path: '/videos' },
        { icon: Users, label: 'Profile', path: '/profile' },
    ];

    if (user?.role === 'admin' || user?.role === 'sub-admin') {
        links.push({ icon: Crown, label: 'Admin Panel', path: '/admin' });
    }

    return (
        <aside
            className={`fixed top-16 left-0 bottom-0 z-40 w-64 glass-card transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:w-20 lg:hover:w-64 group bg-black/80`}
        >
            <div className="flex flex-col h-full py-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-4 px-6 py-4 transition-all relative overflow-hidden ${isActive ? 'text-neon-red' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-red shadow-[0_0_15px_rgba(255,0,85,0.8)]" />
                            )}
                            <Icon className={`w-6 h-6 min-w-[24px] ${isActive ? 'animate-pulse' : ''}`} />
                            <span className="font-medium whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                {link.label}
                            </span>
                        </Link>
                    );
                })}

                <div className="mt-auto px-6 py-4">
                    <Link to="/settings" className="flex items-center gap-4 text-zinc-500 hover:text-white transition-colors">
                        <Settings className="w-6 h-6 min-w-[24px]" />
                        <span className="font-medium whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">Settings</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
