import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, X, Plus, ThumbsUp, ThumbsDown, MessageSquare, Send, Share2 } from 'lucide-react'; // Added Share2
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Videos = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [videoData, setVideoData] = useState({ title: '', url: '' });
    const [commentText, setCommentText] = useState('');
    const [activeCommentVideo, setActiveCommentVideo] = useState(null); // For comment modal
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});

    const handleShare = (e, vid) => {
        e.stopPropagation();
        const url = `https://www.youtube.com/watch?v=${vid.youtubeUrl}`;
        navigator.clipboard.writeText(url);
        alert('Video Link Copied!');
    };

    const handleLike = async (e, vid) => {
        e.stopPropagation();
        if (!user) return alert('Please login to like');
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/like`);
            setVideos(videos.map(v => v._id === vid._id ? { ...v, likes: res.data.likes, dislikes: res.data.dislikes } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, likes: res.data.likes, dislikes: res.data.dislikes }));
            }
        } catch (err) { console.error(err); }
    };

    const handleDislike = async (e, vid) => {
        e.stopPropagation();
        if (!user) return alert('Please login to dislike');
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/dislike`);
            setVideos(videos.map(v => v._id === vid._id ? { ...v, likes: res.data.likes, dislikes: res.data.dislikes } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, likes: res.data.likes, dislikes: res.data.dislikes }));
            }
        } catch (err) { console.error(err); }
    };

    const handleComment = async (e, vid) => {
        e.preventDefault();
        if (!user) return alert('Please login to comment');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/comment`, { text: commentText });
            const updatedComments = res.data;
            setVideos(videos.map(v => v._id === vid._id ? { ...v, comments: updatedComments } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, comments: updatedComments }));
            }

            setCommentText('');
        } catch (err) { alert('Error posting comment'); }
    };

    const handleDelete = async (e, vid) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/videos/${vid._id}`);
            setVideos(videos.filter(v => v._id !== vid._id));
            if (selectedVideo?._id === vid._id) setSelectedVideo(null);
            alert('Video Deleted');
        } catch (err) { alert('Failed to delete video'); }
    };

    const handleCommentLike = async (vid, commentId) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/comment/${commentId}/like`);
            const updatedComments = res.data;
            setVideos(videos.map(v => v._id === vid._id ? { ...v, comments: updatedComments } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, comments: updatedComments }));
            }
        } catch (err) { console.error(err); }
    };

    const handleCommentDislike = async (vid, commentId) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/comment/${commentId}/dislike`);
            const updatedComments = res.data;
            setVideos(videos.map(v => v._id === vid._id ? { ...v, comments: updatedComments } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, comments: updatedComments }));
            }
        } catch (err) { console.error(err); }
    };

    const handleReply = async (e, vid, commentId) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/videos/${vid._id}/comment/${commentId}/reply`, { text: replyText });
            const updatedComments = res.data;
            setVideos(videos.map(v => v._id === vid._id ? { ...v, comments: updatedComments } : v));
            if (activeCommentVideo && activeCommentVideo._id === vid._id) {
                setActiveCommentVideo(prev => ({ ...prev, comments: updatedComments }));
            }
            setReplyText('');
            setReplyingTo(null);
            setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
        } catch (err) { alert('Error posting reply'); }
    };

    // Helper to fetch videos
    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/videos`);
            setVideos(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load videos. Please try again.');
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleAddVideo = async (e) => {
        e.preventDefault();
        try {
            // Extract video ID from ID or Embed Code or URL
            let videoId = videoData.url;
            if (videoData.url.includes('iframe')) {
                const match = videoData.url.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"/);
                if (match) videoId = match[1];
            } else if (videoData.url.includes('v=')) {
                videoId = videoData.url.split('v=')[1].split('&')[0];
            } else if (videoData.url.includes('youtu.be/')) {
                videoId = videoData.url.split('youtu.be/')[1].split('?')[0];
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/videos`, {
                title: videoData.title,
                youtubeUrl: videoId
            });
            setVideoData({ title: '', url: '' });
            setShowModal(false);
            fetchVideos();
            alert('Video Added Successfully!');
        } catch (err) {
            alert('Error adding video');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black italic text-white">LATEST <span className="text-neon-red">HIGHLIGHTS</span></h1>
                {user?.role === 'super-admin' && (
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus /> Add Video
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <p className="text-zinc-500 text-xl">No videos available yet.</p>
                        {user?.role === 'super-admin' && <p className="text-sm mt-2 text-zinc-600">Click "Add Video" to get started.</p>}
                    </div>
                )}
                )}
                {videos.filter(v => v && v._id).map((v) => {
                    const isExpanded = selectedVideo?._id === v._id;
                    return (
                        <motion.div
                            key={v._id}
                            className={`glass-card rounded-xl overflow-hidden group ${isExpanded ? 'fixed inset-0 z-50 m-4 md:m-8 flex flex-col md:flex-row bg-black/95 border-neon-red/50 shadow-2xl' : 'relative'
                                }`}
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* Video Container */}
                            <div className={`relative ${isExpanded ? 'w-full md:w-3/4 h-[40vh] md:h-full' : 'aspect-video'}`}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${v.youtubeUrl}?enablejsapi=1`}
                                    title={v.title}
                                    className="w-full h-full bg-black"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                {/* Overlay for grid view only */}
                                {!isExpanded && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVideo(v);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-red z-10"
                                        title="Expand"
                                    >
                                        <Play size={16} />
                                    </button>
                                )}
                                {/* Close button for expanded view */}
                                {
                                    isExpanded && (
                                        <button
                                            onClick={() => setSelectedVideo(null)}
                                            className="absolute top-4 right-4 md:left-4 md:right-auto p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors z-20"
                                        >
                                            <X />
                                        </button>
                                    )
                                }
                            </div >

                            {/* Info & Interactions (Visible when expanded or small info in grid) */}
                            < div className={`p-4 flex flex-col ${isExpanded ? 'w-full md:w-1/4 bg-zinc-900/50 border-l border-white/10 overflow-y-auto' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-white ${isExpanded ? 'text-xl' : 'line-clamp-2'}`}>{v.title}</h3>
                                    {/* Delete Button for Admin (Visible in both grid and expanded) */}
                                    {/* Delete Button for Admin (Visible in both grid and expanded) */}
                                    {user?.role === 'super-admin' && (
                                        <button
                                            onClick={(e) => handleDelete(e, v)}
                                            className="ml-2 text-zinc-500 hover:text-red-500 transition-colors p-1"
                                            title="Delete Video"
                                        >
                                            {/* Using X (Cross) icon as requested, or Trash. User said "cross icon right up" */}
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-zinc-500 mb-4">Added {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Just now'}</p>

                                {/* Small Box Stats (Visible only when NOT expanded) */}
                                {
                                    !isExpanded && (
                                        <div className="flex items-center gap-4 text-xs text-zinc-400 mt-auto pt-2 border-t border-white/5">
                                            <button
                                                onClick={(e) => handleLike(e, v)}
                                                className={`flex items-center gap-1 hover:text-white transition-colors ${v.likes?.includes(user?.id) ? 'text-neon-blue' : ''}`}
                                            >
                                                <ThumbsUp size={12} /> {v.likes?.length || 0}
                                            </button>
                                            <button
                                                onClick={(e) => handleDislike(e, v)}
                                                className={`flex items-center gap-1 hover:text-white transition-colors ${v.dislikes?.includes(user?.id) ? 'text-red-500' : ''}`}
                                            >
                                                <ThumbsDown size={12} /> {v.dislikes?.length || 0}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCommentVideo(v);
                                                }}
                                                className="flex items-center gap-1 hover:text-white transition-colors"
                                            >
                                                <MessageSquare size={12} /> {v.comments?.length || 0}
                                            </button>
                                        </div>
                                    )
                                }

                                {
                                    isExpanded && (
                                        <div className="space-y-6 flex-1">
                                            {/* Actions */}
                                            <div className="flex gap-4">
                                                <button onClick={(e) => handleLike(e, v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${v.likes?.includes(user?.id) ? 'bg-neon-blue text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                                    <ThumbsUp size={18} /> {(v.likes || []).length}
                                                </button>
                                                <button onClick={(e) => handleDislike(e, v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${v.dislikes?.includes(user?.id) ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                                    <ThumbsDown size={18} /> {(v.dislikes || []).length}
                                                </button>
                                            </div>

                                            {/* Comments Section */}
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                    <MessageSquare size={16} /> Comments ({v.comments?.length || 0})
                                                </h4>

                                                {/* Comment Input */}
                                                <form onSubmit={(e) => handleComment(e, v)} className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        className="w-full bg-black/20 border border-white/10 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:border-neon-blue outline-none"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                    />
                                                    <button type="submit" className="absolute right-1 top-1 p-1.5 bg-neon-blue text-black rounded-full hover:scale-105">
                                                        <Send size={12} />
                                                    </button>
                                                </form>

                                                {/* Comment List */}
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                    {(v.comments || []).filter(c => c).map((c, i) => (
                                                        <div key={i} className="text-sm bg-white/5 p-3 rounded-lg">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-neon-blue">{c.name || 'User'}</span>
                                                                <span className="text-[10px] text-zinc-500">{c.date ? new Date(c.date).toLocaleDateString() : ''}</span>
                                                            </div>
                                                            <p className="text-zinc-300">{c.text}</p>
                                                        </div>
                                                    ))}
                                                    {(!v.comments || v.comments.length === 0) && (
                                                        <p className="text-zinc-500 text-center italic text-sm">No comments yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            </div >
                        </motion.div >
                    );
                })}
                {/* Advanced Comment Modal */}
                <AnimatePresence>
                    {activeCommentVideo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setActiveCommentVideo(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="glass-card w-full max-w-2xl h-[80vh] flex flex-col rounded-3xl relative overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                                    <h2 className="text-xl font-bold text-white">Comments ({activeCommentVideo.comments?.length || 0})</h2>
                                    <button onClick={() => setActiveCommentVideo(null)} className="text-zinc-400 hover:text-white"><X /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {activeCommentVideo.comments?.map((c) => (
                                        <div key={c._id} className="space-y-3">
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-bold text-neon-blue mr-2">{c.name}</span>
                                                        <span className="text-xs text-zinc-500">{new Date(c.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <p className="text-zinc-200 text-sm mb-3">{c.text}</p>

                                                {/* Comment Actions */}
                                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                                    <button onClick={() => handleCommentLike(activeCommentVideo, c._id)} className={`flex items-center gap-1 hover:text-neon-blue ${c.likes?.includes(user?.id) ? 'text-neon-blue' : ''}`}>
                                                        <ThumbsUp size={12} /> {c.likes?.length || 0}
                                                    </button>
                                                    <button onClick={() => handleCommentDislike(activeCommentVideo, c._id)} className={`flex items-center gap-1 hover:text-red-500 ${c.dislikes?.includes(user?.id) ? 'text-red-500' : ''}`}>
                                                        <ThumbsDown size={12} /> {c.dislikes?.length || 0}
                                                    </button>
                                                    <button onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)} className="hover:text-white">
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Replies Logic */}
                                            {c.replies?.length > 0 && (
                                                <div className="pl-6 ml-2">
                                                    {expandedReplies[c._id] ? (
                                                        <div className="space-y-2 border-l-2 border-white/10 pl-4 mt-2">
                                                            {c.replies.map((r, i) => (
                                                                <div key={i} className="bg-black/40 p-3 rounded-lg text-sm group/reply">
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="font-bold text-zinc-400 text-xs mr-2">{r.name}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                setReplyingTo(c._id);
                                                                                setReplyText(`@${r.name} `);
                                                                            }}
                                                                            className="text-[10px] text-zinc-500 hover:text-white opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                    </div>
                                                                    <span className="text-zinc-300">{r.text}</span>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => setExpandedReplies(prev => ({ ...prev, [c._id]: false }))} className="text-xs text-neon-blue hover:underline mt-2">
                                                                Hide replies
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setExpandedReplies(prev => ({ ...prev, [c._id]: true }))} className="text-xs text-neon-blue hover:underline mt-2 flex items-center gap-1">
                                                            <div className="w-8 h-[1px] bg-white/20"></div> View {c.replies.length} replies
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reply Input */}
                                            {replyingTo === c._id && (
                                                <form onSubmit={(e) => handleReply(e, activeCommentVideo, c._id)} className="pl-8 mt-2 flex gap-2">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder={`Reply to ${c.name}...`}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none"
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    />
                                                    <button type="submit" className="p-2 bg-neon-blue text-black rounded-lg hover:bg-neon-blue/80">
                                                        <Send size={14} />
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    ))}
                                    {(!activeCommentVideo.comments || activeCommentVideo.comments.length === 0) && (
                                        <div className="text-center text-zinc-500 py-10">No comments yet. Start the conversation!</div>
                                    )}
                                </div>

                                {/* Main Comment Input */}
                                <div className="p-4 bg-black/60 border-t border-white/10">
                                    <form onSubmit={(e) => handleComment(e, activeCommentVideo)} className="relative">
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-12 py-3 text-white focus:border-neon-blue outline-none"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />
                                        <button type="submit" className="absolute right-2 top-2 p-2 bg-neon-blue text-black rounded-full hover:scale-105 transition-transform">
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >
            {/* Removed separate AnimatePresence Modal since we handle expansion inline */}
            < AnimatePresence >
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="glass-card w-full max-w-lg p-8 rounded-3xl relative"
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                            >
                                <X />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">Add New Video</h2>

                            <form onSubmit={handleAddVideo} className="space-y-4">
                                <input
                                    type="text" placeholder="Video Title" required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none"
                                    value={videoData.title} onChange={e => setVideoData({ ...videoData, title: e.target.value })}
                                />
                                <textarea
                                    placeholder="Paste YouTube Link or Embed Code"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none h-32"
                                    value={videoData.url} onChange={e => setVideoData({ ...videoData, url: e.target.value })}
                                />
                                <p className="text-xs text-zinc-500">Supports: Video URL, Embed Code, or Short URL</p>

                                <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-4">
                                    Add Video
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default Videos;
