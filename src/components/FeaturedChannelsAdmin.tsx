import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import { type FeaturedChannel } from '../types';
import { Plus, Trash2, Edit2, Save, Youtube, Globe, Film } from 'lucide-react';

export const FeaturedChannelsAdmin: FC = () => {
    const [channels, setChannels] = useState<FeaturedChannel[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentChannel, setCurrentChannel] = useState<Partial<FeaturedChannel>>({
        title: '',
        url: '',
        type: 'hls',
        thumbnail: '',
        sort_order: 0,
        is_active: true
    });

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            const data = await ApiClient.getAllFeaturedChannelsAdmin();
            setChannels(data);
        } catch (error) {
            console.error('Failed to load featured channels', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentChannel.id) {
                await ApiClient.updateFeaturedChannel(currentChannel.id, currentChannel);
            } else {
                await ApiClient.addFeaturedChannel(currentChannel);
            }
            setIsEditing(false);
            setCurrentChannel({
                title: '',
                url: '',
                type: 'hls',
                thumbnail: '',
                sort_order: 0,
                is_active: true
            });
            loadChannels();
        } catch (error) {
            console.error('Failed to save channel', error);
            alert('Failed to save channel');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this channel?')) return;
        try {
            await ApiClient.deleteFeaturedChannel(id);
            loadChannels();
        } catch (error) {
            console.error('Failed to delete channel', error);
            alert('Failed to delete channel');
        }
    };

    const handleEdit = (channel: FeaturedChannel) => {
        setCurrentChannel(channel);
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Featured Playlist (Landing Page)</h2>
                <button
                    onClick={() => {
                        setCurrentChannel({ title: '', url: '', type: 'hls', thumbnail: '', sort_order: 0, is_active: true });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                    <Plus size={18} /> Add Channel
                </button>
            </div>

            {isEditing && (
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4">{currentChannel.id ? 'Edit Channel' : 'Add New Channel'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={currentChannel.title}
                                    onChange={e => setCurrentChannel({ ...currentChannel, title: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={currentChannel.type}
                                    onChange={e => setCurrentChannel({ ...currentChannel, type: e.target.value as any })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="hls">HLS Stream (.m3u8)</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="iframe">Iframe / Embed</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Stream URL / YouTube ID</label>
                                <input
                                    type="text"
                                    required
                                    value={currentChannel.url}
                                    onChange={e => setCurrentChannel({ ...currentChannel, url: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder={currentChannel.type === 'youtube' ? 'YouTube Video ID (e.g. dQw4w9WgXcQ)' : 'https://example.com/stream.m3u8'}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Thumbnail URL (Optional)</label>
                                <input
                                    type="text"
                                    value={currentChannel.thumbnail || ''}
                                    onChange={e => setCurrentChannel({ ...currentChannel, thumbnail: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={currentChannel.sort_order}
                                    onChange={e => setCurrentChannel({ ...currentChannel, sort_order: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentChannel.is_active}
                                        onChange={e => setCurrentChannel({ ...currentChannel, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#0a0a0a]"
                                    />
                                    <span className="text-white">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                            >
                                <Save size={18} /> Save Channel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {channels.map(channel => (
                    <div key={channel.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
                        <div className="w-16 h-10 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {channel.thumbnail ? (
                                <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover" />
                            ) : (
                                <ChannelTypeIcon type={channel.type} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{channel.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className={`px-2 py-0.5 rounded-full ${getTypeColor(channel.type)} text-black font-bold uppercase`}>
                                    {channel.type}
                                </span>
                                {channel.is_n8n_live && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-600/80 text-white font-bold uppercase text-[10px]">
                                        N8N LIVE
                                    </span>
                                )}
                                <span className="truncate">{channel.url}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${channel.is_active ? 'bg-green-500' : 'bg-red-500'}`} title={channel.is_active ? 'Active' : 'Inactive'} />
                            <span className="text-gray-500 text-sm font-mono">#{channel.sort_order}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleEdit(channel)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(channel.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Visual Separator for Regular items if any N8N items exist? No, user wanted them managed together */}

                {channels.length === 0 && !isEditing && (
                    <div className="text-center py-12 text-gray-500 bg-[#1a1a1a]/50 rounded-xl border border-white/5 border-dashed">
                        <p>No featured channels added yet.</p>
                    </div>
                )}
            </div>
        </div >
    );
};

const ChannelTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'youtube': return <Youtube size={20} className="text-red-500" />;
        case 'iframe': return <Globe size={20} className="text-blue-400" />;
        default: return <Film size={20} className="text-green-400" />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'youtube': return 'bg-red-500/80 text-white';
        case 'iframe': return 'bg-blue-400/80 text-black';
        default: return 'bg-green-400/80 text-black';
    }
};
