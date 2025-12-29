import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { type Channel } from '../utils/m3uParser';
import clsx from 'clsx';
import { Tv, Search } from 'lucide-react';
import { useChannelStatus } from '../hooks/useChannelStatus';

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    height: number;
}

const ChannelRow = ({ channel, isSelected, onSelect }: { channel: Channel, isSelected: boolean, onSelect: () => void }) => {
    const status = useChannelStatus(channel.url);

    return (
        <div className="px-2 py-1">
            <button
                onClick={onSelect}
                className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 group relative",
                    isSelected
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "hover:bg-white/5 text-gray-300 hover:text-white border border-transparent"
                )}
            >
                {/* Status Indicator */}
                <div className="absolute top-2 right-2 flex items-center justify-center" title={`Status: ${status}`}>
                    {status === 'checking' && (
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                    )}
                    {status === 'online' && (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                    {status === 'offline' && (
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    )}
                </div>

                <div className="relative w-10 h-10 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                    {channel.logo ? (
                        <img
                            src={channel.logo}
                            alt={channel.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <Tv size={18} className={clsx("text-gray-500", channel.logo ? "hidden" : "block")} />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{channel.name}</p>
                        {channel.quality && (
                            <span className={clsx(
                                "text-[10px] px-1 rounded flex-shrink-0 border",
                                channel.quality === '4K' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                    channel.quality === 'FHD' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                        "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            )}>
                                {channel.quality}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="truncate max-w-[80px]">{channel.country || 'Unknown'}</span>
                        <span>•</span>
                        <span className="truncate">{channel.group || 'General'}</span>
                    </div>
                </div>
            </button>
        </div>
    );
};

export const ChannelList: React.FC<ChannelListProps> = ({ channels, selectedChannel, onSelectChannel }) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');

    // Extract unique categories and countries for filters
    const categories = useMemo(() => {
        const groups = new Set(channels.map(c => c.group || 'Uncategorized'));
        return ['All', ...Array.from(groups).sort()];
    }, [channels]);

    const countries = useMemo(() => {
        const cnts = new Set(channels.map(c => c.country || 'Unknown'));
        return ['All', ...Array.from(cnts).sort()];
    }, [channels]);

    const filteredChannels = useMemo(() => {
        return channels.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || (c.group || 'Uncategorized') === selectedCategory;
            const matchesCountry = selectedCountry === 'All' || (c.country || 'Unknown') === selectedCountry;
            return matchesSearch && matchesCategory && matchesCountry;
        });
    }, [channels, search, selectedCategory, selectedCountry]);

    return (
        <div className="flex flex-col h-full bg-[#121212] border-r border-white/5">
            {/* Header / Search / Filters */}
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Channels
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">{filteredChannels.length} results</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search channels..."
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filter Badges (Simplified) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#1a1a1a] text-xs text-gray-300 border border-white/10 rounded-md px-2 py-1 focus:outline-none"
                    >
                        <option value="All">All Genres</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="bg-[#1a1a1a] text-xs text-gray-300 border border-white/10 rounded-md px-2 py-1 focus:outline-none"
                    >
                        <option value="All">All Countries</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="flex-1" style={{ height: 'calc(100% - 150px)' }}> {/* Adjust height calc */}
                {filteredChannels.length > 0 ? (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredChannels}
                        itemContent={(_index, channel) => (
                            <ChannelRow
                                channel={channel}
                                isSelected={selectedChannel?.id === channel.id}
                                onSelect={() => onSelectChannel(channel)}
                            />
                        )}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 space-y-4">
                        <Search size={32} className="opacity-50" />
                        <p>No channels found matching your {search ? 'search' : 'filters'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
