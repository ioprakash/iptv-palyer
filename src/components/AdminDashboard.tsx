
import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { type Channel } from '../utils/m3uParser';
import { Plus, Trash2, Globe, Lock, Save, Youtube, Monitor, Video, Upload, ChevronLeft, ChevronRight, Search, Repeat } from 'lucide-react';
import clsx from 'clsx';

export const AdminDashboard: React.FC = () => {
    // Pagination & Data State
    const [channels, setChannels] = useState<Channel[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Import/Sync State
    const [importContent, setImportContent] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Sync State
    const [syncUrl, setSyncUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
    const [isSyncing, setIsSyncing] = useState(false);

    // Add Channel State
    const [newChannel, setNewChannel] = useState<Partial<Channel>>({
        name: '', url: '', logo: '', group: 'General', type: 'hls', is_public: true, country: 'Unknown'
    });

    useEffect(() => {
        loadChannels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]); // Reload on page/search change

    const loadChannels = async () => {
        try {
            const res = await ApiClient.getAllChannelsAdmin(page, 50, search);
            setChannels(res.data);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (e) {
            console.error(e);
        }
    };

    const handleImport = async (isPublic: boolean) => {
        if (!importContent) return;
        setIsImporting(true);
        try {
            const res = await ApiClient.importPlaylist(importContent, isPublic);
            alert(res.message);
            setImportContent('');
            loadChannels();
            loadChannels();
        } catch {
            alert('Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await ApiClient.syncPlaylist(syncUrl);
            alert(res.message);
            loadChannels();
        } catch {
            alert('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGlobalVisibility = async (isPublic: boolean) => {
        const action = isPublic ? 'Public' : 'Private';
        if (!confirm('Are you sure you want to make ALL channels ' + action + '?')) return;
        try {
            const res = await ApiClient.updateAllVisibility(isPublic);
            alert(res.message);
            loadChannels();
            alert(res.message);
            loadChannels();
        } catch {
            alert('Update failed');
        }
    };

    const handleTogglePublic = async (channel: Channel) => {
        // Optimistic Update
        const updated = { ...channel, is_public: !channel.is_public };
        setChannels(channels.map(c => c.id === channel.id ? updated : c));

        try {
            await ApiClient.togglePublic(channel.id, !channel.is_public);
        } catch {
            loadChannels(); // Revert on error
            alert('Update failed');
        }
    };

    const handleAdd = async () => {
        if (!newChannel.name || !newChannel.url) return alert('Name and URL required');
        await ApiClient.addChannel(newChannel);
        setNewChannel({ name: '', url: '', logo: '', group: 'General', type: 'hls', is_public: true, country: 'Unknown' });
        loadChannels();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this channel?')) {
            await ApiClient.deleteChannel(id);
            loadChannels();
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                        Admin Dashboard
                    </h1>
                    <span className="text-gray-500 font-mono">{total} Channels • Page {page}/{totalPages}</span>
                </div>

                {/* Import Section */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Upload className="text-purple-500" /> Bulk Import M3U
                    </h2>
                    <textarea
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-xs font-mono h-32 focus:border-purple-500 outline-none transition-colors"
                        placeholder="#EXTM3U\n#EXTINF:-1 tvg-logo=... group-title=...\nhttp://..."
                        value={importContent}
                        onChange={e => setImportContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newChannel.is_public} // Reuse state or add new one? Better add new local state
                                onChange={e => setNewChannel(p => ({ ...p, is_public: e.target.checked }))} // Hacky reuse, better fix in state
                                className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                            />
                            Import as Public
                        </label>
                        <button
                            onClick={() => handleImport(newChannel.is_public ?? false)}
                            disabled={isImporting}
                            className={clsx(
                                "bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg px-6 py-2 transition-colors",
                                isImporting && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isImporting ? 'Importing...' : 'Import Playlist'}
                        </button>
                    </div>

                    {/* Sync Section */}
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        <div className="text-sm text-gray-400">
                            <p>Sync with <strong>iptv-org</strong> or custom M3U URL</p>
                            <p className="text-xs text-gray-500">Updates existing metadata, preserves visibility.</p>
                        </div>
                        <div className="flex gap-4">
                            <input
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none"
                                placeholder="https://example.com/playlist.m3u"
                                value={syncUrl}
                                onChange={(e) => setSyncUrl(e.target.value)}
                            />
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className={clsx(
                                    "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 font-bold rounded-lg px-6 py-2 transition-colors flex items-center gap-2",
                                    isSyncing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Repeat size={18} className={clsx(isSyncing && "animate-spin")} />
                                {isSyncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            placeholder="Search channels..."
                            className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:border-blue-500 outline-none"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleGlobalVisibility(true)}
                            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Globe size={16} /> All Public
                        </button>
                        <button
                            onClick={() => handleGlobalVisibility(false)}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Lock size={16} /> All Private
                        </button>
                    </div>
                </div>

                {/* Direct Import Section */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Monitor className="text-blue-400" /> Quick Import Single .m3u8
                    </h2>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-gray-400 font-mono">Stream URL (.m3u8)</label>
                            <input
                                placeholder="http://example.com/stream.m3u8"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                value={newChannel.url} // reusing state for now, but maybe should clarify UX
                                onChange={e => setNewChannel({ ...newChannel, url: e.target.value, type: 'hls' })}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-gray-400 font-mono">Channel Name (Optional - Auto-generated if empty)</label>
                            <input
                                placeholder="Channel Name"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                value={newChannel.name}
                                onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-6 py-2 h-10 transition-colors"
                        >
                            Import
                        </button>
                    </div>
                </div>

                {/* Add Channel Form (Advanced) */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Plus className="text-green-500" /> Add New Channel
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            placeholder="Channel Name"
                            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                            value={newChannel.name}
                            onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                        />
                        <input
                            placeholder="Stream URL (m3u8, youtube link)"
                            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                            value={newChannel.url}
                            onChange={e => setNewChannel({ ...newChannel, url: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <select
                                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none flex-1"
                                value={newChannel.type}
                                value={newChannel.type}
                                onChange={e => setNewChannel({ ...newChannel, type: e.target.value as 'hls' | 'youtube' | 'iframe' })}
                            >
                                <option value="hls">HLS (m3u8)</option>
                                <option value="youtube">YouTube Live</option>
                                <option value="iframe">Web Iframe</option>
                            </select>
                        </div>
                        <input
                            placeholder="Logo URL"
                            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                            value={newChannel.logo}
                            onChange={e => setNewChannel({ ...newChannel, logo: e.target.value })}
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors lg:col-span-4"
                        >
                            <Save size={18} /> Save Channel
                        </button>
                    </div>
                </div>

                {/* Channel List */}
                <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                                <th className="p-4 w-12 text-center">Type</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Group</th>
                                <th className="p-4 w-32 text-center">Visibility</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {channels.map(channel => (
                                <tr key={channel.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-center">
                                        {channel.type === 'youtube' && <Youtube className="text-red-500 mx-auto" size={18} />}
                                        {channel.type === 'hls' && <Video className="text-blue-500 mx-auto" size={18} />}
                                        {channel.type === 'iframe' && <Monitor className="text-green-500 mx-auto" size={18} />}
                                    </td>
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        {channel.logo && <img src={channel.logo} className="w-6 h-6 object-contain rounded" />}
                                        {channel.name}
                                    </td>
                                    <td className="p-4 text-gray-400">{channel.group}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleTogglePublic(channel)}
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all mx-auto w-24 justify-center border",
                                                channel.is_public
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                            )}
                                        >
                                            {channel.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                            {channel.is_public ? 'Public' : 'Private'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(channel.id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors p-2"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-lg disabled:opacity-50 hover:bg-white/5"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-gray-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-lg disabled:opacity-50 hover:bg-white/5"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
