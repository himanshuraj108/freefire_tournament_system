import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Users, Clock, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Tournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null); // For Join Modal
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, loadUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/tournaments');
                setTournaments(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTournaments();
    }, []);

    const openJoinModal = (t) => {
        if (!user) {
            if (window.confirm('Please login to join. Go to Login?')) navigate('/login');
            return;
        }
        setSelectedTournament(t);
        setUpiId('');
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/tournaments/${selectedTournament._id}/join`, { upiId });
            alert('Joined Successfully!');
            setSelectedTournament(null);

            // Refresh list and user
            const res = await axios.get('http://localhost:5000/api/tournaments');
            setTournaments(res.data);
            loadUser();
        } catch (err) {
            alert(err.response?.data?.msg || 'Join Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black italic text-white">ACTIVE <span className="text-neon-red">TOURNAMENTS</span></h1>
                <p className="text-zinc-400">Compete with the best and win big prizes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((t) => (
                    <motion.div
                        key={t._id}
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${t.status === 'Open' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                    t.status === 'Ongoing' ? 'bg-neon-red/20 text-neon-red border border-neon-red/20 animate-pulse' :
                                        'bg-zinc-500/20 text-zinc-400 border border-zinc-500/20'
                                }`}>
                                {t.status === 'ResultsPending' ? 'Verifying Results' : t.status}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">{t.title}</h3>
                            <p className="text-zinc-400 text-sm">{t.description || 'No description'}</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Trophy className="w-4 h-4 text-amber-400" /> Prize Pool
                                </span>
                                <span className="text-amber-400 font-bold">{t.prizePool}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Users className="w-4 h-4 text-blue-400" /> Slots
                                </span>
                                <span className="text-white">{t.participants.length}/{t.maxPlayers}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Clock className="w-4 h-4 text-purple-400" /> Start Time
                                </span>
                                <span className="text-white">{t.startTime ? new Date(t.startTime).toLocaleString() : (t.schedule ? new Date(t.schedule).toLocaleString() : 'TBA')}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-xs text-zinc-500 uppercase">Entry Fee</p>
                                <p className="text-xl font-black text-neon-blue">${t.entryFee}</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (user?.tournamentsJoined?.includes(t._id)) {
                                        navigate(`/tournament/${t._id}`);
                                    } else {
                                        openJoinModal(t);
                                    }
                                }}
                                disabled={t.status !== 'Open' && !user?.tournamentsJoined?.includes(t._id)}
                                className={`px-6 py-2 rounded-lg font-bold transition-all ${(t.status === 'Open' || user?.tournamentsJoined?.includes(t._id))
                                    ? 'bg-neon-red hover:bg-red-600 text-white shadow-lg hover:shadow-neon-red/30'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                {user?.tournamentsJoined?.includes(t._id) ? 'Enter Tournament' : 'Join Now'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* JOIN MODAL */}
            <AnimatePresence>
                {selectedTournament && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-md p-8 rounded-3xl relative"
                        >
                            <button onClick={() => setSelectedTournament(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>

                            <h2 className="text-2xl font-bold text-white mb-2">Join Tournament</h2>
                            <p className="text-zinc-400 text-sm mb-6">Enter your details to register for <span className="text-neon-blue">{selectedTournament.title}</span>.</p>

                            <div className="bg-black/30 p-4 rounded-xl mb-6 flex justify-between items-center border border-white/5">
                                <span className="text-zinc-400">Entry Fee</span>
                                <span className="text-2xl font-bold text-white">${selectedTournament.entryFee}</span>
                            </div>

                            <form onSubmit={handleJoinSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">My Game Name (From Profile)</label>
                                    <input type="text" value={user.name} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Confirm UPI ID for Payment</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="username@upi"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">Win prizes will be sent to this ID if you win.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary py-3 rounded-xl font-bold mt-4 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : `Pay $${selectedTournament.entryFee} & Join`}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tournaments;
