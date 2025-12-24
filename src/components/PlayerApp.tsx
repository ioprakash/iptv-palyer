import React, { useState, useEffect, useMemo } from 'react';
import { ApiClient } from '../api/client';
import { Channel } from '../utils/m3uParser';
import { ModernPlayer } from './ModernPlayer';
import { Search, ChevronDown, MonitorPlay } from 'lucide-react';
import clsx from 'clsx';
import { useChannelStatus } from '../hooks/useChannelStatus';

export const PlayerApp = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('All');

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            // Player view shows only public channels
            const data = await ApiClient.getChannels();
            // Default Sort: A-Z
            data.sort((a, b) => a.name.localeCompare(b.name));
            setChannels(data);
            if (data.length > 0) setSelectedChannel(data[0]);
        } catch (e) {
            console.error('Failed to load channels', e);
        }
    };

    const groups = useMemo(() => {
        const unique = new Set(channels.map(c => c.group || 'General'));
        const defaults = ['Live TV', 'Sports', 'Movies', 'News'];
        // Merge defaults and unique, filtering out any defaults that might already be in unique to avoid dups if case differs (though Set handles exact matches)
        // Actually, we want defaults to appear first in the list if they exist or even if they don't (as empty filters?)
        // User requested "add some random default categories".
        // Let's ensure they are available in the dropdown.

        const merged = new Set([...defaults, ...Array.from(unique)]);
        return ['All', ...Array.from(merged)];
    }, [channels]);

    const filteredChannels = useMemo(() => {
        return channels.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchGroup = selectedGroup === 'All' || c.group === selectedGroup;
            return matchSearch && matchGroup;
        });
    }, [channels, search, selectedGroup]);

    // Channel Item Component with Status
    const ChannelItem = ({ channel }: { channel: Channel }) => {
        const status = useChannelStatus(channel.url);
        const isActive = selectedChannel?.id === channel.id;

        return (
            <button
                onClick={() => setSelectedChannel(channel)}
                className={clsx(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group border border-transparent",
                    isActive ? "bg-blue-600 shadow-lg shadow-blue-500/20 border-blue-500/30" : "hover:bg-white/10 hover:border-white/5"
                )}
            >
                <div className="relative shrink-0">
                    {channel.logo ? (
                        <img src={channel.logo} className="w-10 h-10 rounded-lg object-contain bg-black/40" loading="lazy" />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                            {channel.name.substring(0, 2)}
                        </div>
                    )}
                    {/* Status Dot */}
                    <div className={clsx(
                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0f0f0f]",
                        status === 'online' ? "bg-green-500" : status === 'offline' ? "bg-red-500" : "bg-gray-500"
                    )} />
                </div>

                <div className="min-w-0">
                    <p className={clsx("font-medium text-sm truncate", isActive ? "text-white" : "text-gray-300 group-hover:text-white")}>
                        {channel.name}
                    </p>
                    <p className={clsx("text-xs truncate", isActive ? "text-blue-200" : "text-gray-500")}>
                        {channel.group}
                    </p>
                </div>
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#0a0a0a]">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        <MonitorPlay className="text-blue-500" /> IPTV Player
                    </h1>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            placeholder="Search channels..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                        >
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {filteredChannels.length > 0 ? (
                        filteredChannels.map(channel => (
                            <ChannelItem key={channel.id} channel={channel} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            No channels found
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-600">v1.2.0 • {channels.length} Channels</p>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="flex-1 bg-black relative">
                {selectedChannel ? (
                    <ModernPlayer
                        channel={selectedChannel}
                        allChannels={channels}
                        onChannelSelect={setSelectedChannel}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <p>Select a channel to start watching</p>
                    </div>
                )}
            </div>
        </div>
    );
};
