import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Save, Loader, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const EditProfile = () => {
    const { user, loadUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    // Profile State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        bio: user?.bio || ''
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/users/profile`, formData);
            await loadUser(); // Refresh global user state
            setMessage({ type: 'success', text: 'Profile Updated Successfully!' });
            // Optional: Redirect back to profile after success
            // navigate('/profile');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Update Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-8">
            <Link to="/profile" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} /> Back to Profile
            </Link>

            <h1 className="text-4xl font-black italic text-white mb-8">
                EDIT <span className="text-neon-red">PROFILE</span>
            </h1>

            <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto">
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p - 4 rounded - xl mb - 6 text - sm font - bold ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <User className="text-neon-red" /> Profile Details
                    </h2>
                    <motion.form
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onSubmit={handleProfileUpdate}
                        className="space-y-6"
                    >
                        {/* Avatar Preview */}
                        <div className="flex items-center gap-6 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-neon-red overflow-hidden flex items-center justify-center shrink-0">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-zinc-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{user?.name}</h3>
                                <p className="text-sm text-zinc-500 font-mono">UID: {user?.ffUid}</p>
                                <p className="text-xs text-zinc-600 mt-2">Update your avatar or change your details.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        required
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    {user?.isEmailVerified ? (
                                        <span className="flex items-center gap-1 px-4 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 font-bold whitespace-nowrap">
                                            Verified ✓
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email-request`);
                                                    const code = prompt("Verification OTP sent to your email.\n\nEnter 6-digit code:");
                                                    if (code) {
                                                        await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email-confirm`, { otp: code });
                                                        alert("Email Verified!");
                                                        loadUser();
                                                    }
                                                } catch (err) {
                                                    alert(err.response?.data?.msg || "Verification Failed");
                                                }
                                            }}
                                            className="px-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold whitespace-nowrap hover:bg-amber-500/20 transition-colors"
                                        >
                                            Verify Now ⚠️
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">Changing email will require re-verification.</p>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-2">FreeFire UID (Cannot be changed)</label>
                                <input
                                    type="text"
                                    disabled
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                                    value={user?.ffUid || ''}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-2">Avatar URL or Upload</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/avatar.jpg"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors"
                                        value={formData.avatar}
                                        onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                                    />
                                    <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl cursor-pointer border border-white/10 transition-colors flex items-center gap-2">
                                        <span className="text-sm font-bold whitespace-nowrap">Upload Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const uploadData = new FormData();
                                                uploadData.append('image', file);

                                                try {
                                                    setLoading(true);
                                                    const res = await axios.post('http://localhost:5000/api/upload', uploadData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setFormData({ ...formData, avatar: `http://localhost:5000${res.data.filePath}` });
                                                    alert('Image Uploaded!');
                                                } catch (err) {
                                                    alert('Upload failed');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                            }
                                        />
                                    </label >
                                </div >

                                <p className="text-sm text-zinc-500 mb-3">Or choose a preset avatar:</p>
                                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                                    {[
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
                                        'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky'
                                    ].map((url, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, avatar: url })}
                                            className="w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-neon-red hover:scale-110 transition-all"
                                        >
                                            <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div >

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-2">Bio / About Me</label>
                                <textarea
                                    rows="4"
                                    placeholder="Tell us about your gaming journey..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none focus:bg-black/60 transition-colors resize-none"
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </div >

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader className="animate-spin" /> : <Save size={18} />}
                            Save Profile Changes
                        </button>
                    </motion.form >
                </section >

                {/* Divider */}
                <div className="my-12 h-px bg-white/10" />

                {/* Security Section */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <User className="text-neon-red" /> Security & Danger Zone
                    </h2>

                    <div className="space-y-8">
                        {/* Change Password */}
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const current = e.target.current.value;
                                const newPass = e.target.new.value;
                                if (!current || !newPass) return alert('Fill all fields');
                                setLoading(true);
                                try {
                                    await axios.put(`${import.meta.env.VITE_API_URL}/auth/change-password`,
                                        { currentPassword: current, newPassword: newPass },
                                        { headers: { 'x-auth-token': localStorage.getItem('token') } } // Redundant if interceptor exists but safe
                                    );
                                    alert('Password Changed!');
                                    e.target.reset();
                                } catch (err) {
                                    alert(err.response?.data?.msg || 'Failed');
                                } finally {
                                    setLoading(false);
                                }
                            }} className="space-y-4">
                                <input name="current" type="password" placeholder="Current Password" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none" />
                                <input name="new" type="password" placeholder="New Password" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none" />
                                <button type="submit" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
                                    Update Password
                                </button>
                            </form>
                        </div>

                        {/* Delete Account */}
                        <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                            <h3 className="text-lg font-bold text-red-500 mb-2">Delete Account</h3>
                            <p className="text-sm text-zinc-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                            <button
                                onClick={async () => {
                                    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
                                        const confirmText = prompt('Type "DELETE" to confirm:');
                                        if (confirmText === 'DELETE') {
                                            try {
                                                await axios.delete(`${import.meta.env.VITE_API_URL}/auth/delete-account`);
                                                // Logout logic
                                                localStorage.removeItem('token');
                                                window.location.href = '/login';
                                            } catch (err) {
                                                alert(err.response?.data?.msg || 'Delete Failed');
                                            }
                                        }
                                    }
                                }}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-500/20 hover:border-red-500"
                            >
                                Delete My Account
                            </button>
                        </div>
                    </div>
                </section>
            </div >
        </div >
    );
};

export default EditProfile;
