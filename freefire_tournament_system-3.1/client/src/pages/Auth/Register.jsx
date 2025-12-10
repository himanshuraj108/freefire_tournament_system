import React, { useState } from 'react';
import { Eye, EyeOff, User, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', ffUid: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const { register } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Full Name is required';
        if (!formData.ffUid) newErrors.ffUid = 'FreeFire UID is required';
        if (!formData.email) newErrors.email = 'Email Address is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
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
            await register(formData.name, formData.ffUid, formData.password, formData.email);
            navigate('/');
        } catch (err) {
            setErrors({ form: 'Registration Failed. Try again.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-red/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-3xl w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-zinc-400">Join the elite gaming community</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.form && <div className="text-red-500 text-center font-bold">{errors.form}</div>}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                        <input
                            type="text"
                            className={`w-full bg-black/40 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all`}
                            placeholder="John Doe"
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">FreeFire UID</label>
                        <input
                            type="text"
                            required
                            className={`w-full bg-black/40 border ${errors.ffUid ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all`}
                            placeholder="123456789"
                            onChange={(e) => {
                                setFormData({ ...formData, ffUid: e.target.value });
                                if (errors.ffUid) setErrors({ ...errors, ffUid: '' });
                            }}
                        />
                        {errors.ffUid && <p className="text-red-500 text-xs mt-1">{errors.ffUid}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className={`w-full bg-black/40 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all`}
                            placeholder="you@example.com"
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full bg-black/40 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all pr-10`}
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

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`w-full bg-black/40 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-neon-red focus:ring-1 focus:ring-neon-red outline-none transition-all`}
                            placeholder="••••••••"
                            onChange={(e) => {
                                setFormData({ ...formData, confirmPassword: e.target.value });
                                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                            }}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="w-full btn-primary py-3 rounded-xl text-lg shadow-neon-red/30 mt-4">
                        Sign Up
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
