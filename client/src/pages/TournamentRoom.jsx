import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IoSend } from "react-icons/io5";
import { Send, Settings, Users, MessageSquare, Shield, PlayCircle, StopCircle, Lock, Unlock, ArrowRight } from 'lucide-react';

const TournamentRoom = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [message, setMessage] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchTournament();
        const interval = setInterval(fetchTournament, 3000); // Polling for chat
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [tournament?.messages]);

    const fetchTournament = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/tournaments/${id}`);
            setTournament(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/tournaments/${id}/chat`, { text: message });
            setMessage('');
            fetchTournament();
        } catch (err) {
            alert('Failed to send (Chat might be disabled)');
        }
    };

    const toggleStatus = async () => {
        try {
            const newStatus = tournament.status === 'Open' ? 'Ongoing' : 'Completed';
            await axios.put(`${import.meta.env.VITE_API_URL}/tournaments/${id}/status`, { status: newStatus });
            fetchTournament();
        } catch (err) {
            alert('Error updating status');
        }
    };

    const toggleChat = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/tournaments/${id}/chat-toggle`);
            fetchTournament();
        } catch (err) {
            alert('Error toggling chat');
        }
    };

    if (!tournament) return <div className="text-white text-center mt-20">Loading Room...</div>;
    const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

    return (
        <div className="h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6 flex flex-col">
                {/* Header */}
                <div className="glass-card p-6 rounded-2xl flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black italic text-white">{tournament.title}</h1>
                        <p className="text-zinc-400">ID: {tournament._id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-xl ${tournament.status === 'Open' ? 'bg-green-500/20 text-green-400' :
                        tournament.status === 'Ongoing' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-500'
                        }`}>
                        {tournament.status}
                    </div>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="glass-card p-4 rounded-xl flex gap-4">
                        <button onClick={toggleStatus} className="btn-secondary flex items-center gap-2">
                            {tournament.status === 'Open' ? <PlayCircle className="text-green-500" /> : <StopCircle className="text-red-500" />}
                            {tournament.status === 'Open' ? 'Start Tournament' : 'End Tournament'}
                        </button>
                        <button onClick={toggleChat} className="btn-secondary flex items-center gap-2">
                            {tournament.chatEnabled ? <Unlock className="text-blue-500" /> : <Lock className="text-red-500" />}
                            {tournament.chatEnabled ? 'Disable Chat' : 'Enable Chat'}
                        </button>
                    </div>
                )}

                {/* Timer Section */}
                {tournament.status === 'Open' && (
                    <div className="glass-card p-6 rounded-2xl text-center">
                        <h3 className="text-zinc-400 mb-2">Tournament Starts In</h3>
                        <Countdown targetDate={tournament.schedule} />
                    </div>
                )}

                {/* Room Info */}
                <div className="flex-1 glass-card p-6 rounded-2xl overflow-y-auto">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="text-neon-blue" /> Participants ({tournament.participants.length}/{tournament.maxPlayers})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...tournament.participants]
                            .sort((a, b) => {
                                // Helper to loop up rank
                                const getRank = (p) => {
                                    const w = tournament.winners?.find(w => (w.user === p.user._id) || (p.groupName && w.groupName === p.groupName));
                                    return w ? parseInt(w.position) : 9999;
                                };
                                return getRank(a) - getRank(b);
                            })
                            .map((p, i) => {
                                // Winner Check Logic
                                const winnerInfo = tournament.winners?.find(w =>
                                    (w.user === p.user._id) || (p.groupName && w.groupName === p.groupName)
                                );

                                // Loser Cashback Logic
                                const isLoser = (tournament.status === 'Completed' || tournament.status === 'Closed') && !winnerInfo && tournament.loserPercent > 0;
                                const cashbackAmount = isLoser ? Math.floor(tournament.entryFee * (tournament.loserPercent / 100)) : 0;

                                return (
                                    <div key={i} className={`relative p-3 rounded-lg flex items-start gap-3 border transition-all group ${winnerInfo ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : isLoser ? 'bg-zinc-900/40 border-zinc-700 hover:bg-zinc-800' : 'bg-black/40 border-white/5 hover:bg-white/5'}`}>
                                        {/* Winner Badge */}
                                        {winnerInfo && (
                                            <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                                                <span>#{winnerInfo.position}</span>
                                                <span>🏆 {winnerInfo.prize}</span>
                                            </div>
                                        )}

                                        {/* Loser Cashback Badge */}
                                        {isLoser && (
                                            <div className="absolute -top-3 -right-2 bg-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-white/10 flex items-center gap-1">
                                                <span>↩ ₹{cashbackAmount}</span>
                                            </div>
                                        )}

                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm border border-white/10 shrink-0">
                                            {p.user.name[0]}
                                        </div>
                                        <div className="overflow-hidden w-full">
                                            {p.groupName ? (
                                                <div className="flex flex-col">
                                                    <span className={`font-black truncate text-sm ${winnerInfo ? 'text-amber-400' : isLoser ? 'text-zinc-400' : 'text-neon-blue'}`}>{p.groupName}</span>
                                                    <span className="text-zinc-400 text-xs truncate">C: {p.user.name}</span>
                                                </div>
                                            ) : (
                                                <p className={`font-bold truncate text-sm ${winnerInfo ? 'text-amber-400' : isLoser ? 'text-zinc-400' : 'text-white'}`}>{p.user.name}</p>
                                            )}

                                            {p.playerUids && p.playerUids.length > 0 ? (
                                                <div className="mt-1 space-y-1">
                                                    {p.playerUids.map((uid, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs font-mono">
                                                            <span className={idx === 0 ? "text-neon-blue font-bold" : "text-zinc-500"}>
                                                                {idx === 0 ? "C" : `#${idx + 1}`}
                                                            </span>
                                                            <span className="text-zinc-300">{uid}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-1">
                                                    UID: <span className="text-neon-blue">{p.user.ffUid}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Chat Section */}
            <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare /> Tournament Chat</h3>
                    {(!tournament.chatEnabled || tournament.status === 'Closed') && <span className="text-xs text-red-500 font-bold">LOCKED</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {tournament.messages.map((msg, i) => {
                        const isAdminMsg = msg.role === 'admin' || msg.role === 'sub-admin';
                        return (
                            <div key={i} className={`flex flex-col ${msg.sender._id === user?.id ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 mb-1`}>
                                    {isAdminMsg && (
                                        <span className="bg-neon-red text-black text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Shield size={10} /> ADMIN
                                        </span>
                                    )}
                                    <span className={`text-xs font-bold ${isAdminMsg ? 'text-neon-red' : 'text-zinc-400'}`}>
                                        {msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-zinc-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words ${isAdminMsg
                                    ? 'bg-gradient-to-r from-neon-red/20 to-orange-500/20 border border-neon-red/50 text-white shadow-[0_0_15px_rgba(255,0,0,0.2)]' // Admin Style
                                    : msg.sender._id === user?.id
                                        ? 'bg-neon-blue/20 text-white rounded-br-none border border-neon-blue/30'
                                        : 'bg-white/10 text-zinc-200 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                {((tournament.chatEnabled && tournament.status !== 'Closed') || isAdmin) ? (
                    <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/10">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-12 py-3 text-white focus:border-neon-blue outline-none"
                                placeholder="Send message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type="submit" className="absolute right-2 top-1.5 p-2 bg-neon-blue text-black rounded-full hover:scale-105 transition-transform shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                                <IoSend className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 text-center text-zinc-500 bg-black/20 border-t border-white/10 text-sm font-mono">
                        {tournament.status === 'Closed' ? 'Tournament Closed • Chat Disabled' : 'Chat is disabled by Admin'}
                    </div>
                )}
            </div>
        </div>
    );
};

const Countdown = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (unit) => unit < 10 ? `0${unit}` : unit;

    if (Object.keys(timeLeft).length === 0) {
        return <span className="text-3xl font-black text-neon-red animate-pulse">LIVE NOW</span>;
    }

    return (
        <div className="flex justify-center gap-4 text-white">
            {Object.keys(timeLeft).map((interval, i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-3xl font-black tabular-nums bg-black/40 px-3 py-2 rounded-lg border border-white/10">
                        {format(timeLeft[interval])}
                    </span>
                    <span className="text-xs uppercase text-zinc-500 mt-1">{interval}</span>
                </div>
            ))}
        </div>
    );
};

export default TournamentRoom;
