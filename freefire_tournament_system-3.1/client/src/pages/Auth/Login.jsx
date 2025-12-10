import React, { useState } from 'react';
import { Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        if (!formData.identifier) newErrors.identifier = 'UID or Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await login(formData.identifier, formData.password);
            navigate('/');
        } catch (err) {
            setErrors({ form: 'Login Failed. Check credentials.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-red/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px]" />

            <Link to="/" className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 z-20 group">
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back to Home</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-3xl w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-zinc-400">Login to access tournaments</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.form && <div className="text-red-500 text-center font-bold">{errors.form}</div>}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">FreeFire UID or Email</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={`w-full bg-black/40 border ${errors.identifier ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all pl-10`}
                                placeholder="UID or Email"
                                onChange={(e) => {
                                    setFormData({ ...formData, identifier: e.target.value });
                                    if (errors.identifier) setErrors({ ...errors, identifier: '' });
                                }}
                            />
                            <User className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                        </div>
                        {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full bg-black/40 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all pl-10 pr-10`}
                                placeholder="••••••••"
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3.5 text-zinc-500 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-3 rounded-xl font-bold text-lg shadow-lg shadow-neon-red/20 hover:shadow-neon-red/40 transition-all mb-4"
                    >
                        Login to Battle
                    </button>

                    <div className="text-center text-sm text-zinc-500">
                        <p className="mb-2 flex items-center justify-center gap-1">
                            Don't have an account? <Link to="/register" className="text-neon-blue font-black text-base hover:text-white hover:underline transition-all">REGISTER HERE</Link>
                        </p>
                        <Link
                            to="/forgot-password"
                            className="text-zinc-600 hover:text-neon-red transition-colors text-xs"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
