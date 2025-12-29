import React, { useEffect, useState } from 'react';
import { ApiClient } from '../api/client';
import { type FeaturedChannel } from '../types';
import { Player } from './Player';
import { Youtube, Globe, Monitor, List } from 'lucide-react';

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
            <div className="bg-[#0a0a0a] border-t border-white/10">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <List className="text-blue-500" size={20} />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Featured Playlist</h3>
                </div>

                <div className="flex overflow-x-auto p-4 gap-4 scrollbar-hide">
                    {channels.map((channel, index) => (
                        <button
                            key={channel.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`
                                flex-shrink-0 w-40 p-3 rounded-xl border transition-all text-left group
                                ${index === currentIndex
                                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            <div className="aspect-video rounded-lg bg-black/50 mb-3 overflow-hidden relative border border-white/5">
                                {channel.thumbnail ? (
                                    <img src={channel.thumbnail} className="w-full h-full object-cover" alt={channel.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ChannelTypeIcon type={channel.type} size={24} />
                                    </div>
                                )}
                                {index === currentIndex && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse box-content border-2 border-black" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className={`font-bold text-xs truncate ${index === currentIndex ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>
                                    {channel.title}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                    <ChannelTypeIcon type={channel.type} size={10} />
                                    {channel.type}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ChannelTypeIcon = ({ type, size = 16 }: { type: string, size?: number }) => {
    switch (type) {
        case 'youtube': return <Youtube size={size} className="text-red-500" />;
        case 'iframe': return <Globe size={size} className="text-blue-400" />;
        default: return <Monitor size={size} className="text-green-400" />; // hls
    }
};
