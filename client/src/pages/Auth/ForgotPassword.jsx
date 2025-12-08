import React, { useState } from 'react';
import { Mail, Key, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
            setMessage({ type: 'success', text: 'OTP sent to your email! Check spam folder.' });
            setStep(2);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, { email, otp });
            setMessage({ type: 'success', text: 'OTP Verified!' });
            setStep(3);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Invalid or Expired OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return setMessage({ type: 'error', text: "Passwords don't match" });
        }
        setLoading(true);
        setMessage(null);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, { email, otp, newPassword: passwords.new });
            alert('Password Reset Successfully! Please Login.');
            navigate('/login');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Reset Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-red/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-3xl w-full max-w-md relative z-10"
            >
                <Link to="/login" className="mb-6 inline-flex items-center text-zinc-500 hover:text-white transition-colors text-sm gap-1">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-zinc-400">
                        {step === 1 && "Enter email to receive OTP"}
                        {step === 2 && "Enter OTP sent to your email"}
                        {step === 3 && "Create a new password"}
                    </p>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl mb-6 text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                <AnimatePresence mode='wait'>
                    {step === 1 && (
                        <motion.form
                            key="step1"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                            onSubmit={handleEmailSubmit} className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none pl-10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                {loading ? 'Sending...' : <>Send OTP <ArrowRight size={18} /></>}
                            </button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form
                            key="step2"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                            onSubmit={handleOtpSubmit} className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Enter 6-Digit OTP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none pl-10 text-center tracking-widest text-2xl font-mono"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                    />
                                    <Key className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                {loading ? 'Verifying...' : <>Verify OTP <ArrowRight size={18} /></>}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-500 hover:text-white text-sm">Change Email</button>
                        </motion.form>
                    )}

                    {step === 3 && (
                        <motion.form
                            key="step3"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                            onSubmit={handlePasswordReset} className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none pl-10"
                                        placeholder="••••••••"
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    />
                                    <Lock className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none pl-10"
                                        placeholder="••••••••"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                    <Lock className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
