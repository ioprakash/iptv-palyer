import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { type Channel } from '../utils/m3uParser';
import {
    LayoutDashboard, Tv, Upload, Settings, LogOut,
    Trash2, Globe, Lock, Search, ChevronLeft, ChevronRight,
    Youtube, Video, Monitor, Repeat, CheckSquare, Square, Menu, X,
    Activity, Signal, WifiOff, Star, RefreshCw, Plus
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ChannelStatusBadge } from './ChannelStatusBadge';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'import' | 'settings' | 'sources'>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data State
    const [channels, setChannels] = useState<Channel[]>([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ total: 0, public: 0, private: 0, online: 0, offline: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const uniqueGroups = Array.from(new Set(channels.map(c => c.group || 'General')));
    if (!uniqueGroups.includes('General')) uniqueGroups.push('General');
    if (!uniqueGroups.includes('Live')) uniqueGroups.push('Live');
    uniqueGroups.sort();

    // Import/Sync State
    const [importContent, setImportContent] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [syncUrl, setSyncUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
    const [isSyncing, setIsSyncing] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);

    // Add Channel State
    const [newChannel, setNewChannel] = useState<Partial<Channel>>({
        name: '', url: '', logo: '', group: 'General', type: 'hls', is_public: false, country: 'Unknown', description: ''
    });

    useEffect(() => {
        loadChannels();
        loadStats();
        loadPlaylists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]);

    const loadStats = async () => {
        try {
            const data = await ApiClient.getStats();
            if (data) setStats(data);
        } catch {
            // ensure safe fallback
        }
    };

    const loadPlaylists = async () => {
        try {
            const res = await ApiClient.getPlaylists();
            setPlaylists(res || []);
        } catch (e) {
            console.error('Failed to load playlists', e);
            setPlaylists([]);
        }
    };

    const loadChannels = async () => {
        try {
            const res = await ApiClient.getAllChannelsAdmin(page, 50, search);
            setChannels(res.data || []);
            setTotal(res.total);
            setTotalPages(res.totalPages);
            setSelectedIds(new Set()); // Reset selection on page change
        } catch (e) {
            console.error(e);
            if ((e as Error).message === 'Invalid credentials' || (e as { status?: number }).status === 401) {
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    // --- Bulk Actions ---
    const toggleSelectAll = () => {
        if (selectedIds.size === channels.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(channels.map(c => c.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size) return;
        if (!confirm(`Delete ${selectedIds.size} channels ? `)) return;

        for (const id of selectedIds) {
            await ApiClient.deleteChannel(id);
        }
        loadChannels();
        loadStats();
    };

    const handleBulkVisibility = async (isPublic: boolean) => {
        if (!selectedIds.size) return;
        for (const id of selectedIds) {
            await ApiClient.togglePublic(id, isPublic);
        }
        loadChannels();
        loadStats();
    };

    // --- Actions ---
    const handleImport = async (isPublic: boolean) => {
        if (!importContent) return;
        setIsImporting(true);
        try {
            const res = await ApiClient.importPlaylist(importContent, isPublic);
            alert(res.message);
            setImportContent('');
            loadChannels();
            loadStats();
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
            loadStats();
        } catch {
            alert('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdd = async () => {
        if (!newChannel.name && !newChannel.url) return alert('URL required');
        await ApiClient.addChannel(newChannel);
        setNewChannel({ name: '', url: '', logo: '', group: 'General', type: 'hls', is_public: true, country: 'Unknown', description: '' });
        alert('Channel Added');
        loadChannels();
        loadStats();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this channel?')) {
            try {
                await ApiClient.deleteChannel(id);
                // Wait small delay to ensure DB write before read? Usually not needed if awaited.
                await loadChannels();
                await loadStats();
            } catch (e) {
                alert('Failed to delete channel');
            }
        }
    };

    const handleTogglePublic = async (channel: Channel) => {
        try {
            await ApiClient.togglePublic(channel.id, !channel.is_public);
            loadChannels();
            loadStats();
        } catch {
            alert('Update failed');
        }
    };

    const handleToggleFeatured = async (channel: Channel) => {
        try {
            await ApiClient.toggleFeatured(channel.id, !channel.is_featured);
            loadChannels();
        } catch { alert('Update failed'); }
    };

    // --- Components ---
    const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center bg-opacity-20", color)}>
                <Icon size={24} className={color.replace('/20', '').replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
        </div>
    );

    const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: React.ElementType, label: string }) => (
        <button
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group",
                activeTab === id
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-white/10 shadow-lg shadow-blue-500/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon size={18} className={clsx("transition-transform group-hover:scale-110", activeTab === id ? "text-blue-400" : "text-gray-500")} />
            {label}
        </button>
    );

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed lg:static inset-y-0 left-0 w-72 bg-[#0a0a0a]/80 backdrop-blur-2xl border-r border-white/10 z-50 transition-transform duration-300 transform flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="p-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Tv className="text-blue-500" /> IPTV Admin
                    </h1>
                </div>

                <div className="flex-1 px-4 space-y-2">
                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
                    <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
                    <SidebarItem id="channels" icon={Tv} label="Channels" />
                    <SidebarItem id="sources" icon={Settings} label="Sources" />
                    <SidebarItem id="import" icon={Upload} label="Direct Import" />
                    <SidebarItem id="settings" icon={Settings} label="Settings" />
                </div>

                <div className="p-4 border-t border-white/10 m-4">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium hover:border hover:border-red-500/20">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto relative scroll-smooth">
                {/* Mobile Header */}
                <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 p-4 lg:hidden flex justify-between items-center">
                    <h1 className="text-lg font-bold">IPTV Admin</h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                        <Menu size={24} />
                    </button>
                </div>

                <div className="p-6 lg:p-10 w-full mx-auto space-y-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold">Dashboard Overview</h2>
                                <p className="text-gray-400 mt-2">Real-time statistics of your IPTV network.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard icon={Tv} label="Total Channels" value={stats.total} color="bg-blue-500/20 text-blue-500" />
                                <StatCard icon={Globe} label="Public Channels" value={stats.public} color="bg-green-500/20 text-green-500" />
                                <StatCard icon={Lock} label="Private Channels" value={stats.private} color="bg-orange-500/20 text-orange-500" />
                                <StatCard icon={Activity} label="Monitoring" value={stats.online + stats.offline} color="bg-purple-500/20 text-purple-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Signal className="text-green-400" size={20} /> Online Streams</h3>
                                    <p className="text-4xl font-bold text-green-400">{stats.online}</p>
                                    <p className="text-sm text-gray-500 mt-2">Verified working streams</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><WifiOff className="text-red-400" size={20} /> Offline/Down</h3>
                                    <p className="text-4xl font-bold text-red-400">{stats.offline}</p>
                                    <p className="text-sm text-gray-500 mt-2">Streams failing health check</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-2xl font-bold">Channel Management</h2>
                                {selectedIds.size > 0 && (
                                    <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-lg">
                                        <button onClick={() => handleBulkVisibility(true)} className="bg-green-600/20 text-green-400 hover:bg-green-600/30 px-4 py-2 rounded-lg border border-green-600/30 text-xs font-bold transition-all">Make Public</button>
                                        <button onClick={() => handleBulkVisibility(false)} className="bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-4 py-2 rounded-lg border border-orange-600/30 text-xs font-bold transition-all">Make Private</button>
                                        <div className="w-px bg-white/10 mx-2"></div>
                                        <button onClick={handleBulkDelete} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-lg border border-red-600/30 text-xs font-bold transition-all flex items-center gap-2">
                                            <Trash2 size={14} /> Delete ({selectedIds.size})
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-blue-500" size={20} />
                                <input
                                    placeholder="Search channels..."
                                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl pl-12 pr-4 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>

                            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-black/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4 w-10">
                                                    <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100 transition-opacity">
                                                        {selectedIds.size === channels.length && channels.length > 0 ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="p-4 w-20 text-center">Type</th>
                                                <th className="p-4">Channel Details</th>
                                                <th className="p-4">Group</th>
                                                <th className="p-4 text-center">Status</th>
                                                <th className="p-4 text-center">Visibility</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {channels.map(channel => (
                                                <tr key={channel.id} className={clsx("hover:bg-white/5 transition-colors group", selectedIds.has(channel.id) && "bg-blue-500/5")}>
                                                    <td className="p-4">
                                                        <button onClick={() => toggleSelect(channel.id)} className={clsx("text-gray-500 transition-colors", selectedIds.has(channel.id) ? "text-blue-500" : "hover:text-blue-400")}>
                                                            {selectedIds.has(channel.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {channel.type === 'youtube' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500"><Youtube size={16} /></span>}
                                                        {channel.type === 'hls' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500"><Video size={16} /></span>}
                                                        {channel.type === 'iframe' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500"><Monitor size={16} /></span>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {channel.logo ? (
                                                                <img src={channel.logo} className="w-10 h-10 object-contain rounded-lg bg-black/40" loading="lazy" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 font-bold text-xs">{channel.name.substring(0, 2)}</div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-white">{channel.name}</p>
                                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{channel.url}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 text-xs border border-white/5">{channel.group}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <ChannelStatusBadge id={channel.id} url={channel.url} />
                                                    </td>
                                                    <td className="p-4 text-center space-x-2">
                                                        <button
                                                            onClick={() => handleToggleFeatured(channel)}
                                                            className={clsx(
                                                                "p-2 rounded-full transition-all hover:bg-white/10",
                                                                channel.is_featured ? "text-yellow-400" : "text-gray-600"
                                                            )}
                                                            title="Toggle Featured"
                                                        >
                                                            <Star size={18} fill={channel.is_featured ? "currentColor" : "none"} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleTogglePublic(channel)}
                                                            className={clsx(
                                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                                                channel.is_public
                                                                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 shadow-lg shadow-green-500/10"
                                                                    : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20 shadow-lg shadow-orange-500/10"
                                                            )}
                                                        >
                                                            {channel.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                                            {channel.is_public ? 'Public' : 'Private'}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDelete(channel.id)} className="text-gray-600 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 rounded-lg disabled:opacity-30 transition-colors text-sm">
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <span className="text-sm font-mono text-gray-400">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 rounded-lg disabled:opacity-30 transition-colors text-sm">
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold">Add & Import</h2>

                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
                                <h3 className="text-xl font-semibold flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><Monitor size={20} /></div>
                                    Quick Add Single Channel
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Stream URL</label>
                                        <input placeholder="https://example.com/stream.m3u8" className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all" value={newChannel.url} onChange={e => setNewChannel({ ...newChannel, url: e.target.value })} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Channel Name</label>
                                            <input placeholder="e.g. News 24/7" className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all" value={newChannel.name} onChange={e => setNewChannel({ ...newChannel, name: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Category / Group</label>
                                            <input
                                                list="group-options"
                                                placeholder="Select or Type Category"
                                                className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all"
                                                value={newChannel.group}
                                                onChange={e => setNewChannel({ ...newChannel, group: e.target.value })}
                                            />
                                            <datalist id="group-options">
                                                {uniqueGroups.map(g => <option key={g} value={g} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Stream Type</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all appearance-none"
                                            value={newChannel.type}
                                            onChange={e => setNewChannel({ ...newChannel, type: e.target.value as 'hls' | 'youtube' | 'iframe' })}
                                        >
                                            <option value="hls">HLS (m3u8)</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="iframe">Web/Iframe</option>
                                        </select>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Icon URL (Optional)</label>
                                            <input placeholder="https://..." className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all" value={newChannel.logo} onChange={e => setNewChannel({ ...newChannel, logo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                                            <input placeholder="Short info..." className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all" value={newChannel.description} onChange={e => setNewChannel({ ...newChannel, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <button onClick={handleAdd} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98]">
                                        Add Channel
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
                                <h3 className="text-xl font-semibold flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500"><Upload size={20} /></div>
                                    Bulk Import M3U Text
                                </h3>
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500 rounded-xl p-4 font-mono h-40 text-sm outline-none transition-all"
                                        placeholder={'#EXTM3U\n#EXTINF:-1 tvg-id="example", Example TV\nhttp://example.com/stream.m3u8'}
                                        value={importContent}
                                        onChange={e => setImportContent(e.target.value)}
                                    />
                                    <button onClick={() => handleImport(newChannel.is_public ?? false)} disabled={isImporting} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                                        {isImporting ? <Repeat className="animate-spin" /> : <Upload size={20} />}
                                        {isImporting ? 'Importing...' : 'Import Playlist'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold">Settings</h2>

                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold">Sync Configuration</h3>
                                    <p className="text-sm text-gray-400 mt-1">Manage where your channel list syncs from.</p>
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        className="flex-1 bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all"
                                        value={syncUrl}
                                        onChange={(e) => setSyncUrl(e.target.value)}
                                    />
                                    <button onClick={handleSync} disabled={isSyncing} className="bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                                        <Repeat size={18} className={isSyncing ? "animate-spin" : ""} /> Sync Now
                                    </button>
                                </div>
                            </div>

                            <div className="bg-red-500/5 p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl shadow-xl space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2"><Trash2 size={24} /> Danger Zone</h3>
                                    <p className="text-sm text-red-300/60 mt-1">Irreversible actions. Tread carefully.</p>
                                </div>

                                <div className="flex justify-between items-center bg-red-500/10 p-4 rounded-xl border border-red-500/10">
                                    <div>
                                        <h4 className="font-bold text-red-200">Delete All Channels</h4>
                                        <p className="text-xs text-red-300/50">Remove all {total} channels from the database.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Are you ABSOLUTELY sure? This will delete ALL channels.') && confirm('This action cannot be undone. Type "yes" to confirm.')) {
                                                try {
                                                    await ApiClient.deleteAllChannels();
                                                    alert('All channels deleted.');
                                                    loadChannels();
                                                    loadStats();
                                                } catch {
                                                    alert('Failed to delete all channels.');
                                                }
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        Delete All
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'sources' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Manage Sources</h2>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                                    {isSyncing ? 'Syncing All...' : 'Sync All Sources'}
                                </button>
                            </div>

                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h3 className="tex-lg font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Source</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                                    const url = (form.elements.namedItem('url') as HTMLInputElement).value;
                                    if (name && url) {
                                        try {
                                            await ApiClient.addPlaylist(name, url);
                                            loadPlaylists();
                                            form.reset();
                                        } catch { alert('Failed to add source'); }
                                    }
                                }} className="flex gap-4">
                                    <input name="name" placeholder="Source Name (e.g. IPTV Org)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500" required />
                                    <input name="url" placeholder="M3U URL" className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500" required />
                                    <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-colors">Add</button>
                                </form>
                            </div>

                            <div className="grid gap-4">
                                {Array.isArray(playlists) && playlists.map((pl: any) => (
                                    <div key={pl.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-lg">{pl.name}</h4>
                                            <p className="text-sm text-gray-500 truncate max-w-md">{pl.url}</p>
                                            <p className="text-xs text-gray-600 mt-1">Last Synced: {pl.last_synced || 'Never'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete this source? Channels synced from here might remain until manually deleted.')) {
                                                        await ApiClient.deletePlaylist(pl.id);
                                                        loadPlaylists();
                                                    }
                                                }}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!Array.isArray(playlists) || playlists.length === 0) && (
                                    <div className="text-center py-10 text-gray-500">
                                        No sources added. Add a playlist URL to start syncing channels.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
