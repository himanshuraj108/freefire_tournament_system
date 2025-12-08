import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Users, Clock, History, X } from 'lucide-react'; // Changed CreditCard to History
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlayCircle } from 'lucide-react';

const AllTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [winnerModal, setWinnerModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchTournaments = async () => {
            setLoading(true);
            try {
                const res = await axios.get('http://localhost:5000/api/tournaments');
                // Filter for Archive (Past) Tournaments - ONLY Closed
                const past = res.data.filter(t => t.status === 'Closed');
                setTournaments(past);
            } catch (err) {
                console.error(err);
                setError('Failed to load archive.');
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 relative">
                <button
                    onClick={() => navigate('/tournaments')}
                    className="absolute left-0 top-0 text-xs font-bold text-zinc-500 hover:text-white border border-zinc-800 hover:border-white/20 bg-black/40 px-4 py-2 rounded-full transition-all flex items-center gap-2"
                >
                    ← Back to Active
                </button>
                <h1 className="text-4xl font-black italic text-zinc-500">TOURNAMENT <span className="text-white">ARCHIVE</span></h1>
                <p className="text-zinc-500">Hall of Fame and Past Battles</p>
            </div>

            {loading && <div className="text-center text-zinc-500 animate-pulse text-xl font-bold">Loading History...</div>}
            {error && <div className="text-center text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}
            {!loading && !error && tournaments.length === 0 && (
                <div className="text-center text-zinc-500 text-lg py-10 bg-white/5 rounded-2xl border border-white/5">
                    No completed tournaments yet. The history books are empty!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((t) => (
                    <motion.div
                        key={t._id}
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group opacity-80 hover:opacity-100 transition-opacity"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${t.status === 'Completed' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                'bg-zinc-500/20 text-zinc-400 border border-zinc-500/20'
                                }`}>
                                {t.status}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">{t.title}</h3>
                            <p className="text-zinc-400 text-sm">{t.description || 'No description'}</p>
                        </div>

                        {/* Info */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Trophy className="w-4 h-4 text-amber-400" /> Prize Pool
                                </span>
                                <span className="text-amber-400 font-bold">{t.prizePool}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Users className="w-4 h-4 text-blue-400" /> Participants
                                </span>
                                <span className="text-white">{t.participants.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Clock className="w-4 h-4 text-purple-400" /> Ended
                                </span>
                                <span className="text-white">{t.endTime ? new Date(t.endTime).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        {/* Footer (Only See Winners + Enter if Joined) */}
                        <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                            {/* Check if user joined this closed tournament */}
                            {(user?.tournamentsJoined?.some(joined => joined._id === t._id) || user?.tournamentsJoined?.includes(t._id)) && (
                                <button
                                    onClick={() => navigate(`/tournament/${t._id}`)}
                                    className="w-full bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/50 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-neon-blue/10 flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={18} /> Enter Room (History)
                                </button>
                            )}
                            <button
                                onClick={() => setWinnerModal(t)}
                                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2"
                            >
                                <Trophy size={18} /> See Winners
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* WINNER POPUP MODAL */}
            <AnimatePresence>
                {winnerModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setWinnerModal(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass-card w-full max-w-lg p-0 rounded-3xl relative overflow-hidden bg-[#1a1a1a] border border-amber-500/30 shadow-2xl shadow-amber-500/20"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-amber-600/20 to-amber-900/20 p-6 text-center border-b border-amber-500/20 relative">
                                <button
                                    onClick={() => setWinnerModal(null)}
                                    className="absolute top-4 right-4 text-amber-200/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-wider">Champions</h2>
                                <p className="text-amber-200/70 font-medium mt-1">{winnerModal.title}</p>
                            </div>

                            {/* Winners List */}
                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {winnerModal.winners && winnerModal.winners.length > 0 ? (
                                    [...winnerModal.winners].sort((a, b) => a.position - b.position).map((winner, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-4 p-4 rounded-xl border ${index === 0 ? 'bg-amber-500/10 border-amber-500/40' :
                                                index === 1 ? 'bg-zinc-300/10 border-zinc-400/30' :
                                                    index === 2 ? 'bg-orange-700/10 border-orange-700/30' :
                                                        'bg-white/5 border-white/10 text-zinc-400'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black' :
                                                        'bg-zinc-800 text-gray-400 border border-white/10'
                                                }`}>
                                                {winner.position}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-lg ${index === 0 ? 'text-amber-400' :
                                                    index === 1 ? 'text-slate-300' :
                                                        index === 2 ? 'text-orange-400' :
                                                            'text-white'
                                                    }`}>
                                                    {winner.groupName ? (
                                                        <span>{winner.groupName} <span className="text-xs opacity-60 font-normal block md:inline">({winner.user ? winner.user.name : 'Unknown'})</span></span>
                                                    ) : (
                                                        winner.user ? winner.user.name : 'Unknown Warrior'
                                                    )}
                                                </h4>
                                                <p className="text-zinc-500 text-xs font-mono">{winner.user ? winner.user.ffUid : 'UID: N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-400 uppercase">Prize</p>
                                                <p className="font-bold text-white">{winner.prize}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-zinc-500 italic">
                                        Winners data not available yet.
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-black/20 text-center border-t border-white/5">
                                <p className="text-zinc-500 text-xs">History recorded.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AllTournaments;
