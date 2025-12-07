import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Save, Loader, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Password State
    const [passData, setPassData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Delete Account State
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            return setMessage({ type: 'error', text: 'New passwords do not match' });
        }
        setLoading(true);
        setMessage(null);
        try {
            await axios.put('http://localhost:5000/api/users/password', {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setMessage({ type: 'success', text: 'Password Changed Successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Password Change Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-8">
            <h1 className="text-4xl font-black italic text-white mb-8">
                ACCOUNT <span className="text-neon-red">SETTINGS</span>
            </h1>

            <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto">
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                {/* SECURITY SECTION */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Lock className="text-neon-red" /> Security & Password
                    </h2>
                    <motion.form
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onSubmit={handlePasswordChange}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                    value={passData.currentPassword}
                                    onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                        value={passData.newPassword}
                                        onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                        value={passData.confirmPassword}
                                        onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-secondary w-full py-3 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader className="animate-spin" /> : <Save size={18} />}
                            Update Password
                        </button>
                    </motion.form>

                    {/* Delete Account Section */}
                    <div className="mt-12 pt-8 border-t border-red-500/20 bg-red-500/5 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle size={20} /> Danger Zone</h3>
                        <p className="text-zinc-400 text-sm mb-6">
                            To delete your account, type <strong>DELETE</strong> in the first box and your password in the second.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-red-400 mb-1">Type "DELETE" to confirm</label>
                                <input
                                    type="text"
                                    placeholder="DELETE"
                                    className="w-full bg-black/40 border border-red-500/20 rounded-lg px-4 py-3 text-red-500 placeholder-red-500/30 focus:border-red-500 outline-none transition-colors font-mono"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-red-400 mb-1">Enter your password</label>
                                <input
                                    type="password"
                                    placeholder="Your Password"
                                    className="w-full bg-black/40 border border-red-500/20 rounded-lg px-4 py-3 text-red-500 placeholder-red-500/30 focus:border-red-500 outline-none transition-colors"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (deleteConfirmation === 'DELETE' && deletePassword) {
                                    if (window.confirm('Final warning: This cannot be undone. Are you sure?')) {
                                        setLoading(true);
                                        axios.delete('http://localhost:5000/api/users', { data: { password: deletePassword } })
                                            .then(() => {
                                                alert('Account deleted successfully.');
                                                window.location.href = '/login';
                                            })
                                            .catch(err => {
                                                alert(err.response?.data?.msg || 'Error deleting account');
                                                setLoading(false);
                                            });
                                    }
                                }
                            }}
                            disabled={deleteConfirmation !== 'DELETE' || !deletePassword || loading}
                            className="w-full border border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-500"
                        >
                            {loading ? 'Deleting...' : 'Permanently Delete Account'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
