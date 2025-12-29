import { useState, useEffect, type FC } from 'react';
import { Monitor, Zap, Globe, Play } from 'lucide-react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom'; // Added Link, kept useNavigate for now but will remove if not used
import { ApiClient } from '../api/client';
import type { Channel } from '../utils/m3uParser';
import { FeaturedPlayer } from './FeaturedPlayer';


export const LandingPage: FC = () => {

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
                        {!isMobile && (
                            <Link to="/login" className="text-gray-400 hover:text-white font-medium transition-colors">Admin Login</Link>
                        )}
                        <Link to="/app" className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Open Web Player
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Text */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-gray-300">v2.0 Now Available</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
                            Next Generation <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500">IPTV Experience</span>
                        </h1>
                        {!isMobile && (
                            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                Stream your favorite channels in 4K quality with a modern, lightning-fast web player. No installation required.
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                                <Play size={20} fill="currentColor" /> Start Watching Now
                            </Link>
                            {!isMobile && (
                                <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-lg transition-all backdrop-blur-md">
                                    Manage Playlist
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Hero Image / Player */}
                    <div className="relative block perspective-1000 w-full mt-12 lg:mt-0">
                        {/* Abstract blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] -z-10" />

                        <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
                            <FeaturedPlayer />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Channels Section */}
            {featured.length > 0 && (
                <section className="py-8 border-y border-white/5 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-8 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase">Live Stream</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {featured.map(channel => (
                                <Link
                                    to={`/app?channelId=${channel.id}`}
                                    key={channel.id}
                                    className="group relative bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-400 p-2.5 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col items-center gap-2"
                                >
                                    <div className="w-10 h-10 rounded-md bg-black/40 flex items-center justify-center relative overflow-hidden flex-shrink-0 group-hover:bg-white/20 transition-colors">
                                        {channel.logo ? (
                                            <img src={channel.logo} className="w-full h-full object-contain p-1" alt={channel.name} />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-white">{channel.name.substring(0, 2)}</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-xs md:text-sm text-gray-200 group-hover:text-white text-center w-full truncate tracking-tight">{channel.name}</h3>
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
