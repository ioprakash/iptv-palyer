import React from 'react';
import { Monitor, Zap, Globe, Shield, Star, Play } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link, kept useNavigate for now but will remove if not used
import { ApiClient } from '../api/client';
import { Channel } from '../utils/m3uParser';
import { useEffect, useState } from 'react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate(); // This will be removed as Link is used instead

    const [featured, setFeatured] = useState<Channel[]>([]);

    useEffect(() => {
        ApiClient.getFeatured().then(setFeatured).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Monitor size={18} className="text-white" />
                        </div>
                        <span>IPTV<span className="text-blue-500">Player</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-gray-400 hover:text-white font-medium transition-colors">Admin Login</Link>
                        <Link to="/app" className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Open Web Player
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-gray-300">v2.0 Now Available</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
                        Next Generation <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500">IPTV Experience</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Stream your favorite channels in 4K quality with a modern, lightning-fast web player. No installation required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                            <Play size={20} fill="currentColor" /> Start Watching Now
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-lg transition-all backdrop-blur-md">
                            Manage Playlist
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Channels Section */}
            {featured.length > 0 && (
                <section className="py-10 border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center gap-3 mb-8">
                            <Star className="text-yellow-400" fill="currentColor" />
                            <h2 className="text-2xl font-bold">Featured Channels</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {featured.map(channel => (
                                <Link to={`/app?channelId=${channel.id}`} key={channel.id} className="group bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all hover:scale-105 block">
                                    <div className="aspect-video bg-black/40 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                        {channel.logo ? (
                                            <img src={channel.logo} className="w-full h-full object-contain p-2" alt={channel.name} />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-600">{channel.name.substring(0, 2)}</span>
                                        )}
                                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="fill-white text-white drop-shadow-lg" size={32} />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{channel.name}</h3>
                                    <p className="text-xs text-gray-500">{channel.group}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Features Grid */}
            <div className="py-24 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-yellow-400" size={32} />}
                            title="Zero Latency"
                            description="Powered by advanced HLS streaming technology for instant playback."
                        />
                        <FeatureCard
                            icon={<Monitor className="text-blue-400" size={32} />}
                            title="Crystal Clear HD"
                            description="Stream in 720p, 1080p, and even 4K quality where available."
                        />
                        <FeatureCard
                            icon={<Globe className="text-green-400" size={32} />}
                            title="Global Coverage"
                            description="Watch content from over 100+ countries with smart geolocation."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default group">
        <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-100">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
);
