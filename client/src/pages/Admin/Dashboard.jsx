import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Video, Users, Plus, X, UserMinus, UserCheck, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tournaments');
    const [tournaments, setTournaments] = useState([]);
    const [pendingTournaments, setPendingTournaments] = useState([]); // New state for approval
    const [showModal, setShowModal] = useState(false);
    const [manageModal, setManageModal] = useState(null); // ID of tournament to manage
    const [selectedTournament, setSelectedTournament] = useState(null);
    // Edit Form State for Manage Modal
    const [editFormData, setEditFormData] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);

    // Edit Auto-Prize Config
    const [editIsAutoPrize, setEditIsAutoPrize] = useState(false);
    const [editAdminFee, setEditAdminFee] = useState(50);
    const [editDistStrategy, setEditDistStrategy] = useState('Standard');

    // ... (Existing States)

    // ... 

    // Resize Edit Form Distribution
    useEffect(() => {
        if (!isEditMode) return;
        setEditFormData(prev => {
            const currentDist = [...(prev.prizeDistribution || [])];
            const newCount = parseInt(prev.totalWinners) || 0;
            if (newCount > currentDist.length) {
                return { ...prev, prizeDistribution: [...currentDist, ...Array(newCount - currentDist.length).fill('')] };
            } else if (newCount < currentDist.length) {
                return { ...prev, prizeDistribution: currentDist.slice(0, newCount) };
            }
            return prev;
        });
    }, [editFormData.totalWinners, isEditMode]);

    // Edit Form Auto-Calc Effect
    useEffect(() => {
        if (!editIsAutoPrize) return;

        const entry = parseFloat(editFormData.entryFee) || 0;
        const players = parseInt(editFormData.maxPlayers) || 0;
        const revenue = entry * players;
        const adminCut = revenue * (editAdminFee / 100);
        const userPot = revenue - adminCut;

        const newPrizePoolText = `₹${Math.floor(userPot)}`;

        const winners = parseInt(editFormData.totalWinners) || 1;
        let distribution = [];
        let remainingPot = userPot;

        for (let i = 0; i < winners; i++) {
            let amount = 0;
            if (editDistStrategy === 'Standard') {
                if (i === 0) amount = userPot * 0.5;
                else if (i === 1) amount = userPot * 0.3;
                else if (i === 2) amount = userPot * 0.2;
                else amount = 0;

                if (winners > 3 && i >= 3) {
                    if (i === 0) amount = userPot * 0.45;
                    else if (i === 1) amount = userPot * 0.25;
                    else if (i === 2) amount = userPot * 0.15;
                    else amount = (userPot * 0.15) / (winners - 3);
                }
            } else if (editDistStrategy === 'Halving') {
                if (i === winners - 1) amount = remainingPot;
                else amount = remainingPot * 0.5;
            }
            remainingPot -= amount;
            distribution.push(`$${Math.floor(amount)}`);
        }

        setEditFormData(prev => ({
            ...prev,
            prizePool: newPrizePoolText,
            prizeDistribution: distribution,
        }));
    }, [editIsAutoPrize, editAdminFee, editDistStrategy, editFormData.entryFee, editFormData.maxPlayers, editFormData.totalWinners]);
    const [isAutoPrize, setIsAutoPrize] = useState(false);
    const [adminFeePercent, setAdminFeePercent] = useState(50);
    const [distStrategy, setDistStrategy] = useState('Standard'); // 'Standard', 'Halving'

    const [formData, setFormData] = useState({
        title: '', type: 'Solo', entryFee: 0, prizePool: '', schedule: '', maxPlayers: 48,
        startTime: '', endTime: '', totalWinners: 3, prizeDistribution: ['', '', ''], loserPercent: 0
    });

    const [videos, setVideos] = useState([]);
    const [videoData, setVideoData] = useState({ title: '', url: '' });

    // Winner Declaration State - Array of user IDs
    const [winnersList, setWinnersList] = useState([]);

    // User Management State
    const [users, setUsers] = useState([]);
    const [banModal, setBanModal] = useState({ show: false, user: null });
    const [banData, setBanData] = useState({ type: 'temporary', duration: '24' }); // duration in hours

    useEffect(() => {
        if (activeTab === 'tournaments') fetchTournaments();
        if (activeTab === 'videos') fetchVideos();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'requests') fetchPendingTournaments();
    }, [activeTab]);

    const handleRequestBan = async (u) => {
        if (!window.confirm(`Request to ban ${u.name}?`)) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/users/${u._id}/ban`, {
                banStatus: 'temporary' // Default placeholder, Super Admin decides
            }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
            alert('Ban request submitted.');
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to request ban');
        }
    };

    const handleRejectBan = async (u) => {
        if (!window.confirm(`Reject ban request for ${u.name}?`)) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/users/${u._id}/ban-manage`, {
                action: 'reject'
            }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to reject ban');
        }
    };

    const handleBanUser = async () => {
        if (!banModal.user) return;
        try {
            let banExpires = null;
            if (banData.type === 'temporary') {
                banExpires = new Date(Date.now() + parseInt(banData.duration) * 60 * 60 * 1000);
            }

            // Super Admin Approval/Direct Ban Logic
            // If checking a request, we are technically approving it.
            // The endpoint /ban-manage with action='approve' works, OR /ban works too (as per my backend logic).
            // Let's use /ban-manage for clarity if approving, but /ban covers both.
            // Actually, let's use /ban-manage specifically for approvals if we want to be explicit,
            // but since I made /ban handle "Direct Ban & Clear Request", I can just use /ban here.
            // Wait, if I use /ban, it's consistent.

            if (user.role === 'super-admin' && banModal.user.banRequest?.status === 'pending') {
                await axios.put(`${import.meta.env.VITE_API_URL}/users/${banModal.user._id}/ban-manage`, {
                    action: 'approve',
                    banStatus: banData.type,
                    banExpires
                }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
            } else {
                await axios.put(`${import.meta.env.VITE_API_URL}/users/${banModal.user._id}/ban`, {
                    banStatus: banData.type,
                    banExpires
                }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
            }

            alert(`User ${banModal.user.name} banned successfully.`);
            setBanModal({ show: false, user: null });
            fetchUsers();
        } catch (err) {
            console.error('Ban failed', err);
            alert('Failed to ban user');
        }
    };



    const handleUnbanUser = async (u) => {
        if (!window.confirm(`Are you sure you want to unban ${u.name}?`)) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/users/${u._id}/unban`, {}, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            alert('User unbanned successfully');
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to unban user');
        }
    };

    // ...


    // Auto-calculate prizes when config changes
    useEffect(() => {
        if (!isAutoPrize) return;

        const entry = parseFloat(formData.entryFee) || 0;
        const players = parseInt(formData.maxPlayers) || 0;
        const revenue = entry * players;
        const adminCut = revenue * (adminFeePercent / 100);
        const userPot = revenue - adminCut;

        // Auto-set Prize Pool Text
        const newPrizePoolText = `$${Math.floor(userPot)}`;

        // Distribute
        const winners = parseInt(formData.totalWinners) || 1;
        let distribution = [];

        let remainingPot = userPot;

        for (let i = 0; i < winners; i++) {
            let amount = 0;
            if (distStrategy === 'Standard') {
                if (i === 0) amount = userPot * 0.5;
                else if (i === 1) amount = userPot * 0.3;
                else if (i === 2) amount = userPot * 0.2;
                else amount = 0;

                if (winners > 3 && i >= 3) {
                    if (winners > 3) {
                        if (i === 0) amount = userPot * 0.45;
                        else if (i === 1) amount = userPot * 0.25;
                        else if (i === 2) amount = userPot * 0.15;
                        else amount = (userPot * 0.15) / (winners - 3);
                    }
                }
            } else if (distStrategy === 'Halving') {
                if (i === winners - 1) {
                    amount = remainingPot;
                } else {
                    amount = remainingPot * 0.5;
                }
            }
            remainingPot -= amount;
            distribution.push(`$${Math.floor(amount)}`);
        }

        setFormData(prev => ({
            ...prev,
            prizePool: newPrizePoolText,
            prizeDistribution: distribution,
        }));
    }, [isAutoPrize, adminFeePercent, distStrategy, formData.entryFee, formData.maxPlayers, formData.totalWinners]);

    // Resize distribution array if totalWinners changes manually
    useEffect(() => {
        if (isAutoPrize) return;
        setFormData(prev => {
            const currentDist = [...prev.prizeDistribution];
            const newCount = parseInt(prev.totalWinners) || 0;
            if (newCount > currentDist.length) {
                return { ...prev, prizeDistribution: [...currentDist, ...Array(newCount - currentDist.length).fill('')] };
            } else if (newCount < currentDist.length) {
                return { ...prev, prizeDistribution: currentDist.slice(0, newCount) };
            }
            return prev;
        });
    }, [formData.totalWinners]);

    // Resize Edit Form Distribution
    useEffect(() => {
        if (!isEditMode) return;
        setEditFormData(prev => {
            const currentDist = [...(prev.prizeDistribution || [])];
            const newCount = parseInt(prev.totalWinners) || 0;
            if (newCount > currentDist.length) {
                return { ...prev, prizeDistribution: [...currentDist, ...Array(newCount - currentDist.length).fill('')] };
            } else if (newCount < currentDist.length) {
                return { ...prev, prizeDistribution: currentDist.slice(0, newCount) };
            }
            return prev;
        });
    }, [editFormData.totalWinners, isEditMode]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const distributionArray = editFormData.prizeDistribution.map((p, i) => ({
                rank: i + 1,
                prize: p
            }));

            const payload = { ...editFormData, prizeDistribution: distributionArray };
            await axios.put(`${import.meta.env.VITE_API_URL}/tournaments/${selectedTournament._id}`, payload);
            alert('Tournament Details Updated!');
            fetchTournaments();
            setIsEditMode(false);
            setManageModal(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update tournament');
        }
    };

    const fetchTournaments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/tournaments`);
            setTournaments(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/videos`);
            setVideos(res.data);
        } catch (err) { console.error(err); }
    }

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchPendingTournaments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/tournaments/manage/all`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const all = res.data;
            setPendingTournaments(all.filter(t => t.approvalStatus === 'pending'));
        } catch (err) { console.error(err); }
    };

    const openManageModal = (t) => {
        setSelectedTournament(t);
        // Initialize winners list based on tournament config
        const count = t.totalWinners || 3;
        setWinnersList(Array(count).fill(''));

        // Populate Edit Form
        setEditFormData({
            title: t.title,
            type: t.type,
            entryFee: t.entryFee,
            prizePool: t.prizePool,
            schedule: t.schedule ? new Date(t.schedule).toISOString().slice(0, 16) : '',
            maxPlayers: t.maxPlayers,
            totalWinners: t.totalWinners || 3,
            prizeDistribution: t.prizeDistribution.map(p => p.prize), // Extract prize strings
            loserPercent: t.loserPercent || 0
        });
        setIsEditMode(false);
        setEditIsAutoPrize(false);
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

            await axios.patch(`${import.meta.env.VITE_API_URL}/tournaments/${selectedTournament._id}/status`, updateData);
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
            await axios.post(`${import.meta.env.VITE_API_URL}/tournaments/${selectedTournament._id}/declare-winners`, { winners: winnersArray });
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
                // Actually the backend just receives the array and saves it, but schema expects {rank, prize} logic if we want strictness.
                // But the schema I defined was: prizeDistribution: [{rank: Number, prize: String }]
                // So I need to transform formData.prizeDistribution (array of strings) to that object structure.

                const distributionArray = formData.prizeDistribution.map((p, i) => ({
                    rank: i + 1,
                    prize: p
                }));

                const payload = {
                    ...formData,
                    prizeDistribution: distributionArray
                };

                await axios.post(`${import.meta.env.VITE_API_URL}/tournaments`, payload);
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

                await axios.post(`${import.meta.env.VITE_API_URL}/videos`, {
                    title: videoData.title,
                    youtubeUrl: videoId, // Store just the ID
                    description: videoData.description,
                    tournament: videoData.tournament
                }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                setVideoData({ title: '', url: '', description: '', tournament: '' });
                fetchVideos();
            }
            setShowModal(false);
        } catch (err) {
            console.error(err);
            alert('Error creating item: ' + (err.response?.data?.msg || err.message));
        }
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Filtered Users
    // Filtered Content
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.ffUid.includes(searchQuery) ||
        (user.role === 'super-admin' && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredTournaments = tournaments.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-black italic text-white">ADMIN <span className="text-neon-red">CENTER</span></h1>
            {/* Tabs & Actions */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div className="flex gap-4">
                    {['tournaments', 'videos', 'users', ...(user?.role === 'super-admin' ? ['requests'] : [])].map(tab => (
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
                    (activeTab === 'videos' && user.role !== 'super-admin') ? null : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary flex items-center gap-2 px-6 py-2"
                        >
                            <Plus size={18} />
                            <span>New {activeTab === 'tournaments' ? 'Tournament' : 'Video'}</span>
                        </button>
                    )
                )}
            </div>

            {/* ... Global Search Code ... */}

            {/* Content */}
            {/* ... Grid Content ... */}

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card w-full max-w-2xl p-8 rounded-3xl relative max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={24} className="text-zinc-500 hover:text-white" />
                        </button>

                        <h2 className="text-3xl font-black italic text-white mb-8">
                            ALER NEW <span className="text-neon-blue uppercase">{activeTab === 'tournaments' ? 'TOURNAMENT' : 'VIDEO'}</span>
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {activeTab === 'tournaments' ? (
                                // ... Tournament Form Fields (unchanged) ...
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Game Type</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="Solo">Solo</option>
                                                <option value="Duo">Duo</option>
                                                <option value="Squad">Squad</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* ... Other Tournament Fields ... */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Entry Fee</label>
                                            <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none" value={formData.entryFee} onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Prize Pool</label>
                                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none" value={formData.prizePool} onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Distribution Strategy</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                            value={formData.distributionStrategy}
                                            onChange={(e) => setFormData({ ...formData, distributionStrategy: e.target.value })}
                                        >
                                            <option value="Standard">Standard (Top 3)</option>
                                            <option value="Weighted">Weighted (Top %)</option>
                                            <option value="WinnerTakesAll">Winner Takes All</option>
                                        </select>
                                    </div>
                                    {/* ... More existing tournament fields ... */}
                                    {/* Keeping it generic as I am replacing a big chunk, I'll try to target specific lines if possible but replace_file_content is better for blocks */}
                                    {/* Wait, the instruction is to update Modal Video Form. I should probably use multi_replace. */}
                                    {/* Let's try to target just the button logic first and then the modal form logic separately or together. */}

                                    {/* Since I cannot see the full modal code in the context, I will stick to what is safe. */}
                                    {/* I will use replace_file_content for the Button Logic first. */}
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Video Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                            value={videoData.title}
                                            onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">YouTube URL</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                            value={videoData.url}
                                            onChange={(e) => setVideoData({ ...videoData, url: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                                        <textarea
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none min-h-[100px]"
                                            value={videoData.description || ''}
                                            onChange={(e) => setVideoData({ ...videoData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Link to Tournament (Tag)</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                                            value={videoData.tournament || ''}
                                            onChange={(e) => setVideoData({ ...videoData, tournament: e.target.value })}
                                        >
                                            <option value="">-- No Tournament --</option>
                                            {tournaments.map(t => (
                                                <option key={t._id} value={t._id}>{t.title} ({t.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <button type="submit" className="btn-primary w-full py-4 text-lg font-bold">
                                Create {activeTab === 'tournaments' ? 'Tournament' : 'Video'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Global Search Bar */}
            <div className="relative max-w-md">
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-neon-blue transition-colors"
                />
                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">
                    <Users size={18} />
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'tournaments' && filteredTournaments.map((t) => (
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
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.approvalStatus === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                        t.status === 'Open' ? 'bg-green-500/20 text-green-400' : 'bg-neon-blue/20 text-neon-blue'
                                        }`}>
                                        {t.approvalStatus === 'pending' ? 'PENDING' : t.status}
                                    </span>
                                </div>
                                {user?.role === 'super-admin' && (
                                    <button
                                        onClick={() => openManageModal(t)}
                                        className="text-neon-blue hover:underline text-sm font-bold"
                                    >
                                        Manage
                                    </button>
                                )}
                            </div>
                            {/* Super Admin Delete Option */}
                            {user.role === 'super-admin' && (
                                <button
                                    onClick={() => handleRejectTournament(t._id)}
                                    className="w-full text-center text-xs font-bold text-red-500 hover:bg-red-500/10 py-2 rounded transition-colors"
                                >
                                    Delete Tournament
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
                {activeTab === 'videos' && filteredVideos.map((v) => (
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

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="col-span-full glass-card p-6 rounded-2xl">
                        {/* Removed Local Search Bar */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-zinc-500 border-b border-white/10">
                                    <tr>
                                        <th className="pb-3 pl-4">Name</th>
                                        <th className="pb-3">FF UID</th>
                                        {user.role === 'super-admin' && <th className="pb-3">Email</th>}
                                        <th className="pb-3">Role</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-300">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 pl-4 font-bold text-white">{u.name}</td>
                                            <td className="py-4 font-mono text-neon-blue">{u.ffUid}</td>
                                            {user.role === 'super-admin' && <td className="py-4 text-zinc-400">{u.email}</td>}
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-500/10 text-zinc-400'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="py-4">
                                                {u.banStatus === 'none' ? (
                                                    <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Active</span>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded w-fit mb-1">
                                                            {u.banStatus === 'permanent' ? 'BANNED (Perm)' : 'Temp Ban'}
                                                        </span>
                                                        {u.banStatus === 'temporary' && (
                                                            <span className="text-[10px] text-zinc-500">Until: {new Date(u.banExpires).toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 text-right pr-4 flex justify-end gap-2 items-center">
                                                {/* Role Toggle (Super Admin Only) */}
                                                {user.role === 'super-admin' && u.role !== 'super-admin' && (
                                                    u.role === 'admin' ? (
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm(`Demote ${u.name} to User?`)) return;
                                                                try {
                                                                    await axios.put(`${import.meta.env.VITE_API_URL}/users/${u._id}/role`, { role: 'user' }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                                                                    fetchUsers();
                                                                } catch (err) { alert('Failed to demote'); }
                                                            }}
                                                            className="text-xs font-bold border border-zinc-500 text-zinc-400 hover:bg-zinc-500/20 px-3 py-1 rounded transition-colors mr-2"
                                                        >
                                                            Demote
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm(`Promote ${u.name} to Admin?`)) return;
                                                                try {
                                                                    await axios.put(`${import.meta.env.VITE_API_URL}/users/${u._id}/role`, { role: 'admin' }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                                                                    fetchUsers();
                                                                } catch (err) { alert('Failed to promote'); }
                                                            }}
                                                            className="text-xs font-bold border border-purple-500/50 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded transition-colors mr-2"
                                                        >
                                                            Promote
                                                        </button>
                                                    )
                                                )}

                                                {/* Ban Actions */}
                                                {u.role !== 'admin' && u.role !== 'super-admin' && ( // Prevent banning admins
                                                    u.banStatus !== 'none' ? (
                                                        <button
                                                            onClick={() => handleUnbanUser(u)}
                                                            className="text-xs font-bold border border-green-500/50 text-green-400 hover:bg-green-500/20 px-3 py-1 rounded transition-colors"
                                                        >
                                                            Unban
                                                        </button>
                                                    ) : (
                                                        // Active User Logic
                                                        u.banRequest?.status === 'pending' ? (
                                                            user.role === 'super-admin' ? (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleRejectBan(u)}
                                                                        className="text-xs font-bold border border-red-500 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                                                                        title="Reject Request"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setBanModal({ show: true, user: u })}
                                                                        className="text-xs font-bold border border-amber-500 text-amber-400 hover:bg-amber-500/20 px-3 py-1 rounded transition-colors animate-pulse"
                                                                    >
                                                                        Review Ban
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-3 py-1 rounded">
                                                                    Pending Review
                                                                </span>
                                                            )
                                                        ) : (
                                                            user.role === 'super-admin' ? (
                                                                <button
                                                                    onClick={() => setBanModal({ show: true, user: u })}
                                                                    className="text-xs font-bold border border-red-500/50 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded transition-colors"
                                                                >
                                                                    Ban
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRequestBan(u)}
                                                                    className="text-xs font-bold border border-red-500/50 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded transition-colors"
                                                                >
                                                                    Request Ban
                                                                </button>
                                                            )
                                                        )
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center text-zinc-500 py-8">No registered users found.</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Ban Modal */}
            <AnimatePresence>
                {banModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-sm p-6 rounded-2xl relative border border-red-500/30 shadow-2xl shadow-red-500/10"
                        >
                            <button onClick={() => setBanModal({ show: false, user: null })} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Ban User: <span className="text-neon-red">{banModal.user?.name}</span></h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-zinc-500 font-bold mb-1 block">Ban Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setBanData({ ...banData, type: 'temporary' })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border ${banData.type === 'temporary' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-zinc-400 border-zinc-700'}`}
                                        >
                                            Temporary
                                        </button>
                                        <button
                                            onClick={() => setBanData({ ...banData, type: 'permanent' })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border ${banData.type === 'permanent' ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-zinc-400 border-zinc-700'}`}
                                        >
                                            Permanent
                                        </button>
                                    </div>
                                </div>

                                {banData.type === 'temporary' && (
                                    <div>
                                        <label className="text-xs text-zinc-500 font-bold mb-1 block">Duration</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-400"
                                            value={banData.duration}
                                            onChange={(e) => setBanData({ ...banData, duration: e.target.value })}
                                        >
                                            <option value="1">1 Hour</option>
                                            <option value="6">6 Hours</option>
                                            <option value="24">24 Hours (1 Day)</option>
                                            <option value="72">3 Days</option>
                                            <option value="168">7 Days</option>
                                            <option value="720">30 Days</option>
                                        </select>
                                    </div>
                                )}

                                <button onClick={handleBanUser} className="w-full btn-danger py-3 rounded-xl font-bold mt-2">
                                    Confirm Ban
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="w-8 h-[1px] bg-amber-400/50"></span> Prize Structure
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAutoPrize(!isAutoPrize)}
                                                            className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${isAutoPrize ? 'bg-amber-400 text-black border-amber-400' : 'bg-transparent text-zinc-500 border-zinc-700'}`}
                                                        >
                                                            {isAutoPrize ? '✨ Auto-Calc ON' : 'Manual Mode'}
                                                        </button>
                                                    </div>

                                                    {isAutoPrize && (
                                                        <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-xs text-amber-400 font-bold mb-1 block">Admin Commission (%)</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="range" min="0" max="90" step="5"
                                                                            value={adminFeePercent}
                                                                            onChange={e => setAdminFeePercent(parseInt(e.target.value))}
                                                                            className="flex-1 accent-amber-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                                        />
                                                                        <span className="text-white font-mono font-bold w-12 text-right">{adminFeePercent}%</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-amber-400 font-bold mb-1 block">Distribution Algo</label>
                                                                    <select
                                                                        value={distStrategy}
                                                                        onChange={e => setDistStrategy(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-amber-400 outline-none"
                                                                    >
                                                                        <option value="Standard">Standard (Top 3 Heavy)</option>
                                                                        <option value="Halving">Recursive 50% Split</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Loser Cashback Setting (User Request) */}
                                                            <div className="pt-2 border-t border-white/5">
                                                                <label className="text-xs text-neon-blue font-bold mb-1 block">Loser Cashback % (Consolation)</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="range" min="0" max="100" step="10"
                                                                        value={formData.loserPercent || 0}
                                                                        onChange={e => setFormData({ ...formData, loserPercent: parseInt(e.target.value) })}
                                                                        className="flex-1 accent-neon-blue h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                                    />
                                                                    <span className="text-white font-mono font-bold w-12 text-right">{formData.loserPercent || 0}%</span>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-400 mt-1">
                                                                    Each loser gets: <span className="text-neon-blue font-bold">${((parseFloat(formData.entryFee) || 0) * ((formData.loserPercent || 0) / 100)).toFixed(0)}</span>
                                                                </p>
                                                            </div>

                                                            <div className="flex justify-between text-xs text-zinc-400 font-mono pt-2 border-t border-white/5">
                                                                <span>Revenue: <span className="text-white">${(parseFloat(formData.entryFee) || 0) * (parseInt(formData.maxPlayers) || 0)}</span></span>
                                                                <span>Admin: <span className="text-neon-red">${((parseFloat(formData.entryFee) || 0) * (parseInt(formData.maxPlayers) || 0) * (adminFeePercent / 100)).toFixed(0)}</span></span>
                                                                {/* Adjusted Pot for winners after Refunds */}
                                                                <span>Winner Pot: <span className="text-amber-400">${
                                                                    ((parseFloat(formData.entryFee) || 0) * (parseInt(formData.maxPlayers) || 0) * (1 - adminFeePercent / 100) -
                                                                        ((parseFloat(formData.maxPlayers) || 0) - (parseInt(formData.totalWinners) || 0)) * ((parseFloat(formData.entryFee) || 0) * ((formData.loserPercent || 0) / 100))
                                                                    ).toFixed(0)
                                                                }</span></span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5 w-fit ml-auto">
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
                                <div className="text-right flex flex-col items-end gap-2">
                                    <span className="block text-sm text-zinc-400">Current Status</span>
                                    <span className="text-xl font-bold text-white">{selectedTournament.status}</span>
                                    <button
                                        onClick={() => setIsEditMode(!isEditMode)}
                                        className="mt-2 text-xs font-bold border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors"
                                    >
                                        {isEditMode ? 'Cancel Editing' : 'Edit Configuration'}
                                    </button>
                                </div>
                            </div>

                            {isEditMode ? (
                                <form onSubmit={handleEditSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Title</label>
                                            <input type="text" className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Schedule</label>
                                            <input type="datetime-local" className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white [color-scheme:dark]" value={editFormData.schedule} onChange={e => setEditFormData({ ...editFormData, schedule: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Type</label>
                                            <select className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}>
                                                <option value="Solo">Solo</option>
                                                <option value="Duo">Duo</option>
                                                <option value="Squad">Squad</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Max Players</label>
                                            <input type="number" className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={editFormData.maxPlayers} onChange={e => setEditFormData({ ...editFormData, maxPlayers: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Entry Fee</label>
                                            <input type="number" className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={editFormData.entryFee} onChange={e => setEditFormData({ ...editFormData, entryFee: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold mb-1 block">Prize Pool Text</label>
                                            <input type="text" className="input-field w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={editFormData.prizePool} onChange={e => setEditFormData({ ...editFormData, prizePool: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Advanced Settings */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-neon-blue">Prize & Config</label>
                                            <button
                                                type="button"
                                                onClick={() => setEditIsAutoPrize(!editIsAutoPrize)}
                                                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${editIsAutoPrize ? 'bg-amber-400 text-black border-amber-400' : 'bg-transparent text-zinc-500 border-zinc-700'}`}
                                            >
                                                {editIsAutoPrize ? '✨ Auto-Calc ON' : 'Manual Mode'}
                                            </button>
                                        </div>

                                        {editIsAutoPrize && (
                                            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-amber-400 font-bold mb-1 block">Admin Commission (%)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="range" min="0" max="90" step="5"
                                                                value={editAdminFee}
                                                                onChange={e => setEditAdminFee(parseInt(e.target.value))}
                                                                className="flex-1 accent-amber-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                            <span className="text-white font-mono font-bold w-12 text-right">{editAdminFee}%</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-amber-400 font-bold mb-1 block">Distribution Algo</label>
                                                        <select
                                                            value={editDistStrategy}
                                                            onChange={e => setEditDistStrategy(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-amber-400 outline-none"
                                                        >
                                                            <option value="Standard">Standard (Top 3 Heavy)</option>
                                                            <option value="Halving">Recursive 50% Split</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-xs text-zinc-400 font-mono pt-2 border-t border-white/5">
                                                    <span>Rev: <span className="text-white">${(parseFloat(editFormData.entryFee) || 0) * (parseInt(editFormData.maxPlayers) || 0)}</span></span>
                                                    <span>Admin: <span className="text-neon-red">${((parseFloat(editFormData.entryFee) || 0) * (parseInt(editFormData.maxPlayers) || 0) * (editAdminFee / 100)).toFixed(0)}</span></span>
                                                    <span>Pot: <span className="text-amber-400">${((parseFloat(editFormData.entryFee) || 0) * (parseInt(editFormData.maxPlayers) || 0) * (1 - editAdminFee / 100)).toFixed(0)}</span></span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-4 items-center">
                                                <label className="text-xs text-zinc-400">Total Winners:
                                                    <input type="number" className="ml-2 w-12 bg-black/40 text-center border border-white/10 rounded text-white" value={editFormData.totalWinners} onChange={e => setEditFormData({ ...editFormData, totalWinners: e.target.value })} />
                                                </label>
                                                <label className="text-xs text-zinc-400">Loser %:
                                                    <input type="number" className="ml-2 w-12 bg-black/40 text-center border border-white/10 rounded text-white" value={editFormData.loserPercent} onChange={e => setEditFormData({ ...editFormData, loserPercent: e.target.value })} />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                {editFormData.prizeDistribution?.map((p, i) => (
                                                    <input key={i} type="text" placeholder={`Rank ${i + 1}`} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm text-white" value={p} onChange={e => {
                                                        const newDist = [...editFormData.prizeDistribution];
                                                        newDist[i] = e.target.value;
                                                        setEditFormData({ ...editFormData, prizeDistribution: newDist });
                                                    }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold">Save Changes</button>
                                </form>
                            ) : (
                                <>
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
                                </>
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
