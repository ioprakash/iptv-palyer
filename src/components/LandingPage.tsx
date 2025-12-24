import React from 'react';
import { Play, Monitor, Zap, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#000000] text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Play size={16} className="text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            StreamFlow
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/app')}
                        className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        <span className="block mb-2">Television</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x">
                            Reimagined for Web
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Access thousands of live channels from around the globe.
                        Zero buffering. Crystal clear HD quality. No subscription required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => navigate('/app')}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105"
                        >
                            Start Watching Now
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                            View Channel List
                        </button>
                    </div>
                </div>
            </div>

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
