import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Video, Users, Plus, X } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('tournaments');
    const [tournaments, setTournaments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [manageModal, setManageModal] = useState(null); // ID of tournament to manage
    const [selectedTournament, setSelectedTournament] = useState(null);

    const [formData, setFormData] = useState({
        title: '', type: 'Solo', entryFee: 0, prizePool: '', schedule: '', maxPlayers: 48,
        startTime: '', endTime: '', totalWinners: 3, prizeDistribution: ['', '', '']
    });

    const [videos, setVideos] = useState([]);
    const [videoData, setVideoData] = useState({ title: '', url: '' });

    // Winner Declaration State - Array of user IDs
    const [winnersList, setWinnersList] = useState([]);

    useEffect(() => {
        if (activeTab === 'tournaments') fetchTournaments();
        if (activeTab === 'videos') fetchVideos();
    }, [activeTab]);

    // Update prize distribution array when total winners changes
    useEffect(() => {
        setFormData(prev => {
            const currentDist = [...prev.prizeDistribution];
            const newCount = parseInt(prev.totalWinners) || 0;
            if (newCount > currentDist.length) {
                // Add empty strings
                return { ...prev, prizeDistribution: [...currentDist, ...Array(newCount - currentDist.length).fill('')] };
            } else if (newCount < currentDist.length) {
                // Slice
                return { ...prev, prizeDistribution: currentDist.slice(0, newCount) };
            }
            return prev;
        });
    }, [formData.totalWinners]);

    const fetchTournaments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tournaments');
            setTournaments(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchVideos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/videos');
            setVideos(res.data);
        } catch (err) { console.error(err); }
    }

    const openManageModal = (t) => {
        setSelectedTournament(t);
        // Initialize winners list based on tournament config
        const count = t.totalWinners || 3;
        setWinnersList(Array(count).fill(''));
        setManageModal(true);
    };

    const handleLifecycleUpdate = async (type) => {
        if (!selectedTournament) return;
        try {
            let updateData = {};
            if (type === 'Start') {
                updateData = { status: 'Ongoing', startTime: Date.now() };
            } else if (type === 'End') {
                updateData = { status: 'ResultsPending', endTime: Date.now() };
            } else if (type === 'Close') {
                updateData = { status: 'Closed' };
            }

            await axios.patch(`http://localhost:5000/api/tournaments/${selectedTournament._id}/status`, updateData);
            alert('Status Updated!');
            setManageModal(false);
            fetchTournaments();
        } catch (err) {
            alert('Error updating status');
        }
    };

    const handleDeclareWinners = async () => {
        if (winnersList.some(w => !w)) return alert('Select all winners');

        // Construct winners array dynamically
        const winnersArray = winnersList.map((userId, index) => {
            // Find prize from distribution or default
            let prize = 'Prize';
            if (selectedTournament.prizeDistribution && selectedTournament.prizeDistribution[index]) {
                prize = selectedTournament.prizeDistribution[index].prize;
            } else {
                // Fallback prizes
                if (index === 0) prize = '1st Prize';
                else if (index === 1) prize = '2nd Prize';
                else if (index === 2) prize = '3rd Prize';
                else prize = 'Winner Prize';
            }

            return {
                position: index + 1,
                user: userId,
                prize: prize
            };
        });

        try {
            await axios.post(`http://localhost:5000/api/tournaments/${selectedTournament._id}/declare-winners`, { winners: winnersArray });
            alert('Winners Declared & Tournament Completed!');
            setManageModal(false);
            fetchTournaments();
        } catch (err) {
            alert('Error declaring winners');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'tournaments') {
                // Map the simple string array to the object structure expected by backend schema
                // Actually the backend just receives the array and saves it, but schema expects { rank, prize } logic if we want strictness.
                // But the schema I defined was: prizeDistribution: [{ rank: Number, prize: String }]
                // So I need to transform formData.prizeDistribution (array of strings) to that object structure.

                const distributionArray = formData.prizeDistribution.map((p, i) => ({
                    rank: i + 1,
                    prize: p
                }));

                const payload = {
                    ...formData,
                    prizeDistribution: distributionArray
                };

                await axios.post('http://localhost:5000/api/tournaments', payload);
                setFormData({
                    title: '', type: 'Solo', entryFee: 0, prizePool: '', schedule: '', maxPlayers: 48,
                    startTime: '', endTime: '', totalWinners: 3, prizeDistribution: ['', '', '']
                });
                fetchTournaments();
            } else if (activeTab === 'videos') {
                // Extract video ID from ID or Embed Code or URL
                let videoId = videoData.url;
                if (videoData.url.includes('iframe')) {
                    const match = videoData.url.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"/);
                    if (match) videoId = match[1];
                } else if (videoData.url.includes('v=')) {
                    videoId = videoData.url.split('v=')[1].split('&')[0];
                } else if (videoData.url.includes('youtu.be/')) {
                    videoId = videoData.url.split('youtu.be/')[1];
                }

                await axios.post('http://localhost:5000/api/videos', {
                    title: videoData.title,
                    youtubeUrl: videoId // Store just the ID
                });
                setVideoData({ title: '', url: '' });
                fetchVideos();
            }
            setShowModal(false);
        } catch (err) {
            alert('Error creating item');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-black italic text-white">ADMIN <span className="text-neon-red">CENTER</span></h1>
            {/* Tabs & Actions */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div className="flex gap-4">
                    {['tournaments', 'videos', 'users'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-lg font-bold capitalize transition-colors ${activeTab === tab ? 'text-neon-blue' : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab !== 'users' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-2"
                    >
                        <Plus size={18} />
                        <span>New {activeTab === 'tournaments' ? 'Tournament' : 'Video'}</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'tournaments' && tournaments.map((t) => (
                    <motion.div
                        key={t._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 text-6xl font-black text-white/5 pointer-events-none">
                            {t.type}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{t.title}</h3>
                        <div className="space-y-2 text-zinc-400">
                            <p className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Prize: {t.prizePool}</p>
                            <p>Entry: ${t.entryFee}</p>
                            <p>Players: {t.participants.length} / {t.maxPlayers}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'Open' ? 'bg-green-500/20 text-green-400' : 'bg-neon-blue/20 text-neon-blue'
                                }`}>
                                {t.status}
                            </span>
                            <button
                                onClick={() => openManageModal(t)}
                                className="text-neon-blue hover:underline text-sm font-bold"
                            >
                                Manage
                            </button>
                        </div>
                    </motion.div>
                ))}
                {activeTab === 'videos' && videos.map((v) => (
                    <motion.div
                        key={v._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-4 rounded-2xl relative overflow-hidden group"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">{v.title}</h3>
                        <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                            <iframe
                                src={`https://www.youtube.com/embed/${v.youtubeUrl}`}
                                className="w-full h-full"
                                title={v.title}
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Create/Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card w-full max-w-2xl p-0 rounded-3xl relative overflow-hidden bg-[#121212] border border-white/10 shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-zinc-900 to-black">
                                <div>
                                    <h2 className="text-2xl font-black italic text-white tracking-wide uppercase">
                                        {activeTab === 'tournaments' ? <><span className="text-neon-red">NEW</span> TOURNAMENT</> : 'ADD VIDEO'}
                                    </h2>
                                    <p className="text-zinc-500 text-xs font-mono mt-1">CONFIGURE YOUR EVENT SETTINGS</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="overflow-y-auto p-8 custom-scrollbar">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {activeTab === 'tournaments' ? (
                                        <>
                                            {/* Section 1: Basic Info */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-8 h-[1px] bg-neon-blue/50"></span> Basic Information
                                                </h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="group">
                                                        <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block group-focus-within:text-white transition-colors">Tournament Title</label>
                                                        <input type="text" placeholder="e.g. Pro League Season 1" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none focus:bg-black/60 transition-all font-bold placeholder:font-normal placeholder:text-zinc-700" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Game Mode</label>
                                                            <div className="relative">
                                                                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                                    <option value="Solo">Solo Battle</option>
                                                                    <option value="Duo">Duo Queue</option>
                                                                    <option value="Squad">Squad War</option>
                                                                </select>
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Start Schedule</label>
                                                            <input type="datetime-local" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none [color-scheme:dark]" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 2: Economy & Players */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-neon-red uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-8 h-[1px] bg-neon-red/50"></span> Stakes & Slots
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Entry Fee ($)</label>
                                                        <input type="number" placeholder="0" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none font-mono" value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Max Players</label>
                                                        <input type="number" placeholder="48" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none font-mono" value={formData.maxPlayers} onChange={e => setFormData({ ...formData, maxPlayers: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Total Prize Pool Display</label>
                                                    <input type="text" placeholder="e.g. $1000 + Exclusive Skins" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-amber-400 focus:border-amber-400 outline-none font-bold" value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Section 3: Winners Config */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-8 h-[1px] bg-amber-400/50"></span> Prize Structure
                                                    </h3>
                                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                                        <label className="text-xs text-zinc-400">Total Winners:</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={formData.totalWinners}
                                                            onChange={e => setFormData({ ...formData, totalWinners: parseInt(e.target.value) || 1 })}
                                                            className="w-12 bg-transparent text-center font-bold text-white outline-none border-b border-white/20 focus:border-amber-400"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {formData.prizeDistribution.map((prize, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-xs font-black border-r border-white/10 ${index === 0 ? 'bg-amber-500/20 text-amber-500' :
                                                                    index === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                                                                        index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                                            'bg-white/5 text-zinc-500'
                                                                    }`}>
                                                                    #{index + 1}
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Prize (e.g. $500)"
                                                                    required
                                                                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-lg pl-12 pr-4 py-2 text-sm text-white focus:border-amber-400 outline-none transition-all"
                                                                    value={prize}
                                                                    onChange={e => {
                                                                        const newDist = [...formData.prizeDistribution];
                                                                        newDist[index] = e.target.value;
                                                                        setFormData({ ...formData, prizeDistribution: newDist });
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-8 h-[1px] bg-neon-blue/50"></span> Video Details
                                                </h3>
                                                <div>
                                                    <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">Video Title</label>
                                                    <input type="text" placeholder="e.g. Best Highlights #4" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none" value={videoData.title} onChange={e => setVideoData({ ...videoData, title: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500 font-bold ml-1 mb-1 block">YouTube URL</label>
                                                    <input type="text" placeholder="https://youtu.be/..." required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-neon-blue font-mono focus:border-neon-blue outline-none" value={videoData.url} onChange={e => setVideoData({ ...videoData, url: e.target.value })} />
                                                </div>
                                            </div>
                                            {videoData.url && (
                                                <div className="aspect-video bg-black/40 rounded-xl border border-white/10 flex items-center justify-center">
                                                    <span className="text-zinc-500 text-sm">Preview will appear on save</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-white/10">
                                        <button type="submit" className="w-full btn-primary py-4 rounded-xl font-black text-lg shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 tracking-wide uppercase">
                                            {activeTab === 'tournaments' ? 'Launch Tournament' : 'Add Video'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {manageModal && selectedTournament && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-4xl p-8 rounded-3xl relative my-8"
                        >
                            <button onClick={() => setManageModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedTournament.title}</h2>
                                    <p className="text-neon-blue font-mono">{selectedTournament._id}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm text-zinc-400">Current Status</span>
                                    <span className="text-xl font-bold text-white">{selectedTournament.status}</span>
                                </div>
                            </div>

                            {/* Lifecycle Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button onClick={() => handleLifecycleUpdate('Start')} className="btn-primary py-3 flex justify-center items-center gap-2">
                                    Start Tournament
                                </button>
                                <button onClick={() => handleLifecycleUpdate('End')} className="btn-secondary py-3 flex justify-center items-center gap-2">
                                    End Game & Verify
                                </button>
                                <button onClick={() => handleLifecycleUpdate('Close')} className="border border-red-500 text-red-500 hover:bg-red-500/10 py-3 rounded-xl font-bold">
                                    Close Tournament
                                </button>
                            </div>

                            {/* Winner Declaration */}
                            {selectedTournament.status === 'ResultsPending' && (
                                <div className="bg-black/30 p-6 rounded-2xl mb-8 border border-amber-500/20">
                                    <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2"><Trophy /> Declare Winners ({winnersList.length} Positions)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {winnersList.map((val, index) => (
                                            <div key={index}>
                                                <label className="text-sm text-zinc-400 mb-1 block">
                                                    Rank #{index + 1}
                                                    <span className="text-amber-500 ml-2">
                                                        ({selectedTournament.prizeDistribution && selectedTournament.prizeDistribution[index] ? selectedTournament.prizeDistribution[index].prize : 'Prize'})
                                                    </span>
                                                </label>
                                                <select
                                                    className="input-field"
                                                    value={val}
                                                    onChange={(e) => {
                                                        const newList = [...winnersList];
                                                        newList[index] = e.target.value;
                                                        setWinnersList(newList);
                                                    }}
                                                >
                                                    <option value="">Select User</option>
                                                    {selectedTournament.participants.slice().reverse().map((p, i) => (
                                                        <option key={p.user ? p.user._id : i} value={p.user ? p.user._id : ''}>
                                                            {p.groupName ? `${p.groupName} (C: ${p.user ? p.user.name : '-'})` : `${p.user ? p.user.name : 'Unknown'} (${p.user ? p.user.ffUid : 'N/A'})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleDeclareWinners} className="w-full mt-4 bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors">
                                        Confirm {winnersList.length} Winners
                                    </button>
                                </div>
                            )}

                            {/* Participants Table */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">Participants ({selectedTournament.participants.length})</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-zinc-500 border-b border-white/10">
                                            <tr>
                                                <th className="pb-3 pl-4">#</th>
                                                <th className="pb-3">Player/Team Name</th>
                                                <th className="pb-3">Team UIDs</th>
                                                <th className="pb-3">UPI ID</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-zinc-300">
                                            {selectedTournament.participants.map((p, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 pl-4 align-top">{i + 1}</td>
                                                    <td className="py-3 font-bold text-white align-top">
                                                        {p.groupName ? (
                                                            <div>
                                                                <span className="text-neon-blue">{p.groupName}</span>
                                                                <span className="block text-xs text-zinc-500 font-normal">C: {p.user?.name}</span>
                                                            </div>
                                                        ) : (
                                                            p.user?.name || 'Loading...'
                                                        )}
                                                    </td>
                                                    <td className="py-3 align-top">
                                                        {p.playerUids && p.playerUids.length > 0 ? (
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                {p.playerUids.map((uid, idx) => (
                                                                    <span key={idx} className={`font-mono ${idx === 0 ? 'text-neon-blue font-bold' : 'text-zinc-400'}`}>
                                                                        {idx === 0 ? 'C: ' : `#${idx + 1}: `}{uid}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-neon-blue font-mono">{p.user?.ffUid || 'N/A'}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 font-mono align-top">{p.upiId || '-'}</td>
                                                    <td className="py-3 align-top">
                                                        <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs">Joined</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {selectedTournament.participants.length === 0 && (
                                        <p className="text-center text-zinc-500 py-8">No participants yet.</p>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
};

export default AdminDashboard;
