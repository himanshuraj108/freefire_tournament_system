import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative h-[500px] rounded-3xl overflow-hidden glass-card flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 hover:scale-105 transition-transform duration-700" />
                <div className="relative z-10 text-center space-y-6 max-w-2xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl font-black italic text-white drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]"
                    >
                        DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-orange-500">BATTLEGROUND</span>
                    </motion.h1>
                    <p className="text-xl text-zinc-300">Join daily tournaments, complete quests, and win real rewards.</p>
                    <Link to="/tournaments">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary text-xl px-8 py-4"
                        >
                            Join Tournament Now
                        </motion.button>
                    </Link>
                </div>
            </section>

            {/* Stats/Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Active Players", val: "10K+", color: "text-neon-blue" },
                    { title: "Daily Tournaments", val: "50+", color: "text-neon-red" },
                    { title: "Total Prize Pool", val: "$100K", color: "text-amber-400" }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass p-6 rounded-2xl text-center"
                    >
                        <h3 className={`text-4xl font-bold ${item.color} mb-2`}>{item.val}</h3>
                        <p className="text-zinc-400">{item.title}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Home;
