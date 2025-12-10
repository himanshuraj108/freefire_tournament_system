import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Trophy, Wallet, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';


const Profile = () => {
    const { user, loadUser } = useAuth();
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawUpi, setWithdrawUpi] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);

    React.useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/${user._id}/transactions`); // Fallback if wallet route specific
            // Actually, we made a specific route: /api/wallet/history
            const res2 = await axios.get(`${import.meta.env.VITE_API_URL}/wallet/history`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setTransactions(res2.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Updated to use the correct endpoint
            await axios.post(`${import.meta.env.VITE_API_URL}/wallet/withdraw`, {
                amount: Number(withdrawAmount),
                upiId: withdrawUpi
            }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            toast.success('Withdrawal request submitted!');
            setWithdrawModal(false);
            setWithdrawAmount('');
            setWithdrawUpi('');
            fetchTransactions();
            if (loadUser) loadUser(); // Refresh balance
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

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
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-zinc-500" />
                        )}
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

                <div className="flex flex-col gap-3 z-10">
                    <Link to="/edit-profile" className="btn-secondary flex items-center justify-center gap-2">
                        <Edit className="w-4 h-4" /> Edit Profile
                    </Link>
                    <button
                        onClick={() => setWithdrawModal(true)}
                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50 px-6 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-600/10 flex items-center justify-center gap-2"
                    >
                        <Wallet className="w-4 h-4" /> Withdraw
                    </button>
                </div>
            </motion.div>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {withdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-sm p-6 rounded-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Withdraw Funds</h3>
                            <p className="text-zinc-400 text-sm mb-4">Balance: <span className="text-amber-400 font-bold">₹{user.walletBalance}</span></p>

                            <form onSubmit={handleWithdraw} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={user.walletBalance}
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">UPI ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={withdrawUpi}
                                        onChange={e => setWithdrawUpi(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                                        placeholder="username@upi"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || user.walletBalance <= 0}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : 'Request Withdrawal'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <Wallet className="text-green-400" /> Withdrawal History
                    </h3>
                    {transactions && transactions.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {transactions.map((txn, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div>
                                        <div className="text-white font-bold">₹{txn.amount}</div>
                                        <div className="text-xs text-zinc-500">{new Date(txn.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold uppercase ${txn.status === 'approved' ? 'text-green-400' :
                                            txn.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                                            }`}>
                                            {txn.status}
                                        </div>
                                        <div className="text-[10px] text-zinc-600">{txn.upiId}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No withdrawals found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
