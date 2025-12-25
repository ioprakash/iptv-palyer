import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { Channel } from '../utils/m3uParser';
import { ChannelList } from './ChannelList';
import { ModernPlayer } from './ModernPlayer';
import { Menu, ArrowLeft, Tv } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const PlayerApp = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch public channels
                const data = await ApiClient.getChannels();
                setChannels(data);

                // Auto-select from URL or default to first
                const urlChannelId = searchParams.get('channelId');
                if (urlChannelId) {
                    const target = data.find(c => c.id === urlChannelId);
                    if (target) {
                        setSelectedChannel(target);
                    } else if (data.length > 0) {
                        setSelectedChannel(data[0]);
                    }
                } else if (data.length > 0 && !selectedChannel) {
                    setSelectedChannel(data[0]);
                }
            } catch (e) {
                console.error("Failed to load channels", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-mono animate-pulse">Loading Channels...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden relative font-sans text-white">
            {/* Mobile Header Overlay */}
            <div className="lg:hidden absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
                <button
                    className="p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-white pointer-events-auto hover:bg-white/10 active:scale-95 transition-all"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed lg:relative z-40 h-full w-80 bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
                ${isSidebarOpen ? 'translate-x-0 ml-0' : '-translate-x-full lg:ml-[-20rem]'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#121212]">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-gray-400 hover:text-white lg:hidden"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-gray-400 hover:text-white hidden lg:block"
                                title="Collapse Sidebar"
                            >
                                <Menu size={20} />
                            </button>
                            <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                                <ArrowLeft size={16} className="hidden lg:block" /> Back
                            </Link>
                        </div>
                        <h1 className="font-bold flex items-center gap-2 text-blue-500">
                            <Tv size={20} /> IPTV
                        </h1>
                    </div>

                    {/* Channel List */}
                    <div className="flex-1 overflow-hidden">
                        <ChannelList
                            channels={channels}
                            selectedChannel={selectedChannel}
                            onSelectChannel={(c) => {
                                setSelectedChannel(c);
                                // Close sidebar on mobile when selecting a channel
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            height={0} // Managed by CSS/Virtuoso internally usually
                        />
                    </div>
                </div>
            </div>

            {/* Sidebar Backdrop (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Open Sidebar Button (External) */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-50 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all shadow-xl"
                    title="Open Sidebar"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Main Player Area */}
            <div className={`flex-1 h-full w-full relative flex flex-col bg-black transition-all ${isSidebarOpen ? '' : 'w-full'}`}>
                {selectedChannel ? (
                    <ModernPlayer
                        channel={selectedChannel}
                        allChannels={channels}
                        onChannelSelect={setSelectedChannel}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <Tv size={64} className="opacity-20" />
                        <p className="text-lg">Select a channel to start watching</p>
                    </div>
                )}
            </div>
        </div>
    );
};
