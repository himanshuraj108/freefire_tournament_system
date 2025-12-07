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
                            <Wallet className="w-4 h-4" /> ${user.walletBalance || 0}
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
                        <ul className="space-y-4">
                            {user.tournamentsJoined.map((tid, i) => (
                                <li key={i} className="flex justify-between items-center text-zinc-400 border-b border-white/5 pb-2">
                                    <span>Tournament ID: {tid}</span>
                                    <span className="text-neon-blue">Joined</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No tournaments joined yet.</p>
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
