import React, { useEffect, useState } from 'react';
import { ApiClient } from '../api/client';
import { type FeaturedChannel } from '../types';
import { Player } from './Player';
import { Youtube, Globe, Monitor } from 'lucide-react';

export const FeaturedPlayer: React.FC = () => {
    const [channels, setChannels] = useState<FeaturedChannel[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await ApiClient.getFeaturedChannels();
                setChannels(data);
                if (data.length > 0) setCurrentIndex(0);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    if (channels.length === 0) return null;

    const currentChannel = channels[currentIndex];

    return (
        <div className="w-full max-w-5xl mx-auto backdrop-blur-3xl bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in-up">
            {/* Player Area */}
            <div className="aspect-video w-full bg-black relative">
                {currentChannel && (
                    <Player url={currentChannel.url} type={currentChannel.type} />
                )}
            </div>

            {/* Playlist Controller */}
            <div className="bg-[#0a0a0a] border-t border-white/10 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                        {currentChannel?.is_n8n_live ? <span className="text-red-500 animate-pulse">LIVE EVENT</span> : 'Live Stream'}
                    </h3>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {channels.map((channel, index) => (
                        <button
                            key={channel.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`
                                group relative p-2 rounded-lg border transition-all duration-300 flex flex-col items-center gap-2 hover:-translate-y-0.5
                                ${index === currentIndex
                                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            <div className="w-10 h-10 rounded-md bg-black/40 flex items-center justify-center relative overflow-hidden flex-shrink-0 group-hover:bg-white/20 transition-colors">
                                {channel.thumbnail ? (
                                    <img src={channel.thumbnail} className="w-full h-full object-contain p-1" alt={channel.title} />
                                ) : (
                                    <ChannelTypeIcon type={channel.type} size={18} />
                                )}
                                {index === currentIndex && (
                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                    </div>
                                )}
                                {channel.is_n8n_live && (
                                    <div className="absolute top-0 right-0 p-0.5 bg-red-600 text-[8px] font-bold text-white rounded-bl-sm">
                                        LIVE
                                    </div>
                                )}
                            </div>

                            <h4 className={`font-bold text-xs text-center w-full truncate ${index === currentIndex ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>
                                {channel.title}
                            </h4>
                        </button>
                    ))}
                </div>
            </div>
        </div >
    );
};

const ChannelTypeIcon = ({ type, size = 16 }: { type: string, size?: number }) => {
    switch (type) {
        case 'youtube': return <Youtube size={size} className="text-red-500" />;
        case 'iframe': return <Globe size={size} className="text-blue-400" />;
        default: return <Monitor size={size} className="text-green-400" />; // hls
    }
};
