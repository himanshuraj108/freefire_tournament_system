import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Trophy, Wallet, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user } = useAuth();
    // In a real app, we would fetch fresh data including detailed tournament history here.
    // For now, using 'user' from context which might need refresh.

    if (!user) return <div className="text-white">Please Login</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-black italic text-white">PLAYER <span className="text-neon-red">PROFILE</span></h1>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-32 bg-neon-blue/10 rounded-full blur-[80px]" />

                <div className="w-32 h-32 rounded-full border-4 border-neon-red p-1">
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <User className="w-16 h-16 text-zinc-500" />
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                    <p className="text-neon-blue font-mono text-lg tracking-wider mb-4">UID: {user.ffUid}</p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <span className="px-4 py-2 rounded-full glass flex items-center gap-2 text-amber-400 font-bold">
                            <Wallet className="w-4 h-4" /> ₹{user.walletBalance || 0}
                        </span>
                        <span className="px-4 py-2 rounded-full glass flex items-center gap-2 text-purple-400 font-bold">
                            <Trophy className="w-4 h-4" /> {user.tournamentsJoined ? user.tournamentsJoined.length : 0} Wins
                        </span>
                    </div>
                </div>

                <Link to="/edit-profile" className="btn-secondary flex items-center gap-2 relative z-10">
                    <Edit className="w-4 h-4" /> Edit Profile
                </Link>
            </motion.div>

            {/* Recent Activity / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="text-neon-red" /> Recent Tournaments
                    </h3>
                    {user.tournamentsJoined && user.tournamentsJoined.length > 0 ? (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {user.tournamentsJoined.map((t, i) => (
                                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white text-sm line-clamp-1">{t.title || `Tournament #${t._id || t}`}</h4>
                                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${t.status === 'Open' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                            t.status === 'Ongoing' ? 'text-neon-red border-neon-red/30 bg-neon-red/10 animate-pulse' :
                                                t.status === 'Completed' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                    'text-zinc-500 border-zinc-500/30'
                                            }`}>
                                            {t.status || 'Joined'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end text-xs text-zinc-400">
                                        <span>{t.startTime ? new Date(t.startTime).toLocaleDateString() : 'Date TBA'}</span>
                                        {t.status === 'Completed' && <span className="text-amber-500 font-bold">Ended</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No tournaments joined yet. <Link to="/tournaments" className="text-neon-blue hover:underline">Join Now!</Link></p>
                    )}
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Wallet className="text-green-400" /> Transaction History
                    </h3>
                    <p className="text-zinc-500 text-center py-8">No transactions found.</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;
