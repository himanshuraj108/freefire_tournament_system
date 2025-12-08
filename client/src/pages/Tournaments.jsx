import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Users, Clock, CreditCard, X, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Tournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [videos, setVideos] = useState([]);
    const [winnerModal, setWinnerModal] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [viewVideo, setViewVideo] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [playerUids, setPlayerUids] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user, loadUser } = useAuth();
    const { searchQuery } = useSearch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTournaments = async () => {
            setLoading(true);
            try {
                const [tournamentsRes, videosRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/tournaments'),
                    axios.get('http://localhost:5000/api/videos')
                ]);

                // Filter for Active Tournaments (Includes Completed until Closed)
                const active = tournamentsRes.data.filter(t => ['Open', 'Ongoing', 'ResultsPending', 'Completed'].includes(t.status));
                setTournaments(active);
                setVideos(videosRes.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const openJoinModal = (tournament) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedTournament(tournament);

        // Initialize Team UIDs based on type
        let slots = 1;
        if (tournament.type === 'Duo') slots = 2;
        if (tournament.type === 'Squad') slots = 4;

        const initialUids = Array(slots).fill('');

        // Strategy:
        // Slot 0: User's FF UID (Always)
        // Slot 1+: Load from local storage "teammates" array if available, or empty

        if (user.ffUid) initialUids[0] = user.ffUid;

        const savedTeammates = JSON.parse(localStorage.getItem('savedTeammates') || '[]');

        for (let i = 1; i < slots; i++) {
            if (savedTeammates[i - 1]) {
                initialUids[i] = savedTeammates[i - 1];
            }
        }

        setPlayerUids(initialUids);
        setGroupName('');
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/tournaments/${selectedTournament._id}/join`, {
                upiId,
                playerUids,
                groupName
            }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            // Save Teammate UIDs (Exclude Captain's UID at index 0)
            const teammatesToSave = playerUids.slice(1).filter(uid => uid.trim() !== '');
            localStorage.setItem('savedTeammates', JSON.stringify(teammatesToSave));

            // Success
            toast.success('Joined successfully! Preparing for battle...');
            const joinedId = selectedTournament._id;
            setSelectedTournament(null);
            setUpiId('');
            setPlayerUids([]);
            setGroupName('');

            navigate(`/tournament/${joinedId}`);

            if (loadUser) loadUser();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Join failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 relative">
                <h1 className="text-4xl font-black italic text-white">ACTIVE <span className="text-neon-red">TOURNAMENTS</span></h1>
                <p className="text-zinc-400">Compete with the best and win big prizes</p>

                <button
                    onClick={() => navigate('/all-tournaments')}
                    className="absolute right-0 top-0 text-xs font-bold text-zinc-500 hover:text-white border border-zinc-800 hover:border-white/20 bg-black/40 px-4 py-2 rounded-full transition-all flex items-center gap-2"
                >
                    <Clock size={14} /> Tournament Archive
                </button>
            </div>

            {loading && <div className="text-center text-neon-blue animate-pulse text-xl font-bold">Loading Active Battles...</div>}
            {error && <div className="text-center text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}
            {!loading && !error && tournaments.length === 0 && (
                <div className="text-center text-zinc-500 text-lg py-10 bg-white/5 rounded-2xl border border-white/5">
                    No active tournaments right now. Check the <span className="text-neon-blue cursor-pointer hover:underline" onClick={() => navigate('/all-tournaments')}>Archive</span> for past winners!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((t) => (
                        <motion.div
                            key={t._id}
                            whileHover={{ y: -5 }}
                            className="glass-card p-6 rounded-2xl relative overflow-hidden group"
                        >
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${t.status === 'Open' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                    t.status === 'Ongoing' ? 'bg-neon-red/20 text-neon-red border border-neon-red/20 animate-pulse' :
                                        t.status === 'Completed' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                            'bg-zinc-500/20 text-zinc-400 border border-zinc-500/20'
                                    }`}>
                                    {t.status === 'ResultsPending' ? 'Verifying Results' : t.status}
                                </span>
                            </div>

                            {/* Title & Desc */}
                            < div className="mb-6" >
                                <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">{t.title}</h3>
                                <p className="text-zinc-400 text-sm">{t.description || 'No description'}</p>
                            </div>

                            {/* Info Grid */}
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

                            {/* Buttons Footer */}
                            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                                {/* Watch Tournament Button (If Video Exists) */}
                                {(() => {
                                    const linkedVideo = videos.find(v => v.tournament && (v.tournament._id === t._id || v.tournament === t._id));
                                    return linkedVideo ? (
                                        <button
                                            onClick={() => setViewVideo(linkedVideo)}
                                            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/50 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-600/10 flex items-center justify-center gap-2 mb-2"
                                        >
                                            <PlayCircle size={18} /> Watch Tournament
                                        </button>
                                    ) : null;
                                })()}

                                <div className="flex items-center justify-between gap-3">
                                    {t.status === 'Completed' ? (
                                        <div className="w-full flex gap-2">
                                            {(user?.tournamentsJoined?.some(joined => joined._id === t._id) || user?.tournamentsJoined?.includes(t._id)) && (
                                                <button
                                                    onClick={() => navigate(`/tournament/${t._id}`)}
                                                    className="w-1/2 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/50 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-neon-blue/10 flex items-center justify-center gap-2"
                                                >
                                                    <Clock size={16} /> Enter Room
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setWinnerModal(t)}
                                                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2"
                                            >
                                                <Trophy size={18} /> See Winners
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-left">
                                                <p className="text-xs text-zinc-500 uppercase">Entry Fee</p>
                                                <p className="text-xl font-black text-neon-blue">${t.entryFee}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const isJoined = user?.tournamentsJoined?.some(joined => joined._id === t._id) || user?.tournamentsJoined?.includes(t._id);
                                                    if (isJoined) {
                                                        navigate(`/tournament/${t._id}`);
                                                    } else {
                                                        openJoinModal(t);
                                                    }
                                                }}
                                                disabled={t.status !== 'Open' && !user?.tournamentsJoined?.some(joined => joined._id === t._id)}
                                                className={`px-6 py-2 rounded-lg font-bold transition-all ${(t.status === 'Open' || user?.tournamentsJoined?.some(joined => joined._id === t._id))
                                                    ? 'bg-neon-red hover:bg-red-600 text-white shadow-lg hover:shadow-neon-red/30'
                                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {(user?.tournamentsJoined?.some(joined => joined._id === t._id) || user?.tournamentsJoined?.includes(t._id))
                                                    ? 'Enter Tournament'
                                                    : (t.status !== 'Open' ? 'Completed' : 'Join Now')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                }
            </div >

            {/* Video Modal */}
            <AnimatePresence>
                {viewVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setViewVideo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-white/10 p-1 rounded-2xl w-full max-w-4xl relative"
                        >
                            <button
                                onClick={() => setViewVideo(null)}
                                className="absolute -top-12 right-0 p-2 text-white hover:text-red-500 transition-colors"
                            >
                                <X size={32} />
                            </button>
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${viewVideo.youtubeUrl}?autoplay=1`}
                                    title={viewVideo.title}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="p-4">
                                <h2 className="text-2xl font-bold text-white mb-2">{viewVideo.title}</h2>
                                <p className="text-zinc-400">{viewVideo.description}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JOIN MODAL (Existing) */}
            < AnimatePresence >
                {selectedTournament && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-md p-8 rounded-3xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
                        >
                            <button onClick={() => setSelectedTournament(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>

                            <h2 className="text-2xl font-bold text-white mb-2">Join Tournament</h2>
                            <p className="text-zinc-400 text-sm mb-6">Enter your details to register for <span className="text-neon-blue">{selectedTournament.title}</span>.</p>

                            <div className="bg-black/30 p-4 rounded-xl mb-6 flex justify-between items-center border border-white/5">
                                <span className="text-zinc-400">Entry Fee</span>
                                <span className="text-2xl font-bold text-white">${selectedTournament.entryFee}</span>
                            </div>

                            <form onSubmit={handleJoinSubmit} className="space-y-4">
                                {/* Group Name Input for Duo/Squad */}
                                {(selectedTournament.type === 'Duo' || selectedTournament.type === 'Squad') && (
                                    <div>
                                        <label className="block text-sm text-zinc-400 font-bold mb-2">Team/Clan Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Delta Force"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none focus:bg-black/60 transition-colors font-bold"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Dynamic Team Inputs */}
                                <div className="space-y-3">
                                    <label className="block text-sm text-zinc-400 font-bold mb-2">Team Details ({selectedTournament.type})</label>
                                    {playerUids.map((uid, index) => (
                                        <div key={index} className="relative">
                                            <label className="text-xs text-zinc-500 mb-1 block">
                                                {index === 0 ? 'Captain UID (You)' : `Player ${index + 1} UID`}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder={index === 0 ? "Your FF UID" : "Teammate UID"}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors font-mono"
                                                    value={uid}
                                                    onChange={(e) => {
                                                        const newUids = [...playerUids];
                                                        newUids[index] = e.target.value;
                                                        setPlayerUids(newUids);
                                                    }}
                                                />
                                                {uid && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newUids = [...playerUids];
                                                            newUids[index] = '';
                                                            setPlayerUids(newUids);
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <label className="block text-sm text-zinc-400 mb-2">Confirm UPI ID for Prize Payment</label>
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
                                    <p className="text-xs text-zinc-500 mt-2">Team prizes will be sent to this ID.</p>
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
            </AnimatePresence >

            {/* WINNER POPUP MODAL */}
            < AnimatePresence >
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
                                                        'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black' :
                                                        'bg-zinc-800 text-zinc-400 border border-white/10'
                                                }`}>
                                                {winner.position}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-lg ${index === 0 ? 'text-amber-400' :
                                                    index === 1 ? 'text-slate-300' :
                                                        index === 2 ? 'text-orange-400' :
                                                            'text-zinc-300'
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
                                <p className="text-zinc-500 text-xs">Prizes are distributed to connected UPI IDs.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default Tournaments;
