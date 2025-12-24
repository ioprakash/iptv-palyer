import { useEffect, useState, useRef } from 'react';
import { type Channel } from '../utils/m3uParser';
import { ApiClient } from '../api/client';
import { Player } from './Player';
import { ChannelList } from './ChannelList';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PlayerApp() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);
    const [containerHeight, setContainerHeight] = useState(window.innerHeight);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const data = await ApiClient.getChannels();
                setChannels(data);
            } catch (error) {
                console.error('Failed to fetch channels', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();

        const handleResize = () => {
            setContainerHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden" ref={containerRef}>
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 h-full border-r border-white/5 flex flex-col">
                <div className="h-14 flex items-center px-4 border-b border-white/5">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <ChannelList
                            channels={channels}
                            selectedChannel={selectedChannel}
                            onSelectChannel={setSelectedChannel}
                            height={containerHeight - 56} // Subtract header height
                        />
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <main className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
                    {selectedChannel ? (
                        <div className="w-full max-w-5xl space-y-4 animate-in fade-in duration-500">
                            <Player key={selectedChannel.url} url={selectedChannel.url} />
                            <div className="flex items-center gap-4">
                                {selectedChannel.logo && (
                                    <img src={selectedChannel.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-1" />
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                        {selectedChannel.name}
                                    </h1>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-sm text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                            LIVE
                                        </span>
                                        {selectedChannel.quality && (
                                            <span className="text-sm text-gray-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                                {selectedChannel.quality}
                                            </span>
                                        )}
                                        {selectedChannel.country && (
                                            <span className="text-sm text-gray-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                                {selectedChannel.country}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                                <Loader2 size={48} className="text-gray-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-200">Select a Channel</h1>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Choose from thousands of free live TV channels to start watching immediately.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
