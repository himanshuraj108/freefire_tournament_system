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
        startTime: '', endTime: ''
    });

    const [videos, setVideos] = useState([]);
    const [videoData, setVideoData] = useState({ title: '', url: '' });

    // Winner Declaration State
    const [winners, setWinners] = useState({ first: '', second: '', third: '' });

    useEffect(() => {
        if (activeTab === 'tournaments') fetchTournaments();
        if (activeTab === 'videos') fetchVideos();
    }, [activeTab]);

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
        if (!winners.first || !winners.second || !winners.third) return alert('Select all winners');

        const winnersArray = [
            { position: 1, user: winners.first, prize: '1st Prize' },
            { position: 2, user: winners.second, prize: '2nd Prize' },
            { position: 3, user: winners.third, prize: '3rd Prize' }
        ];

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
                await axios.post('http://localhost:5000/api/tournaments', formData);
                setFormData({ title: '', type: 'Solo', entryFee: 0, prizePool: '', schedule: '', maxPlayers: 48, startTime: '', endTime: '' });
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-lg p-8 rounded-3xl relative"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>
                            <h2 className="text-2xl font-bold text-white mb-6">{activeTab === 'tournaments' ? 'Create Tournament' : 'Add Video'}</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {activeTab === 'tournaments' ? (
                                    <>
                                        <input type="text" placeholder="Tournament Title" required className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                <option value="Solo">Solo</option>
                                                <option value="Duo">Duo</option>
                                                <option value="Squad">Squad</option>
                                            </select>
                                            <input type="number" placeholder="Entry Fee" required className="input-field" value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: e.target.value })} />
                                        </div>
                                        <input type="text" placeholder="Prize Pool" required className="input-field" value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: e.target.value })} />
                                        <label className="text-sm text-zinc-400">Schedule Time</label>
                                        <input type="datetime-local" required className="input-field" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} />
                                        <input type="number" placeholder="Max Players" required className="input-field" value={formData.maxPlayers} onChange={e => setFormData({ ...formData, maxPlayers: e.target.value })} />
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Video Title" required className="input-field" value={videoData.title} onChange={e => setVideoData({ ...videoData, title: e.target.value })} />
                                        <input type="text" placeholder="Youtube URL" required className="input-field" value={videoData.url} onChange={e => setVideoData({ ...videoData, url: e.target.value })} />
                                    </>
                                )}
                                <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-4">Create</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manage Tournament Modal */}
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
                                    <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2"><Trophy /> Declare Winners</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { pos: '1st', key: 'first' },
                                            { pos: '2nd', key: 'second' },
                                            { pos: '3rd', key: 'third' }
                                        ].map(rank => (
                                            <div key={rank.key}>
                                                <label className="text-sm text-zinc-400 mb-1 block">{rank.pos} Place (User Index/ID)</label>
                                                <select
                                                    className="input-field"
                                                    onChange={(e) => setWinners({ ...winners, [rank.key]: e.target.value })}
                                                >
                                                    <option value="">Select User</option>
                                                    {selectedTournament.participants.slice().reverse().map((p, i) => (
                                                        <option key={p.user ? p.user._id : i} value={p.user ? p.user._id : ''}>
                                                            {p.user ? p.user.name : 'Unknown'} ({p.user ? p.user.ffUid : 'N/A'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleDeclareWinners} className="w-full mt-4 bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors">
                                        Confirm Winners
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
                                                <th className="pb-3">Player Name</th>
                                                <th className="pb-3">FF UID</th>
                                                <th className="pb-3">UPI ID</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-zinc-300">
                                            {selectedTournament.participants.map((p, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 pl-4">{i + 1}</td>
                                                    <td className="py-3 font-bold text-white">{p.user?.name || 'Loading...'}</td>
                                                    <td className="py-3 text-neon-blue font-mono">{p.user?.ffUid || 'N/A'}</td>
                                                    <td className="py-3 font-mono">{p.upiId || '-'}</td>
                                                    <td className="py-3">
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
