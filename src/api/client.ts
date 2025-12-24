import { Channel } from '../utils/m3uParser';

const API_Base = 'http://localhost:3001/api';

export const ApiClient = {
    getChannels: async (): Promise<Channel[]> => {
        const res = await fetch(`${API_Base}/channels`);
        return res.json();
    },

    getAllChannelsAdmin: async (page = 1, limit = 50, search = ''): Promise<{ data: Channel[], total: number, page: number, totalPages: number }> => {
        const res = await fetch(`${API_Base}/admin/channels?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },

    importPlaylist: async (content: string, is_public = false) => {
        const res = await fetch(`${API_Base}/admin/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, is_public })
        });
        return res.json();
    },

    syncPlaylist: async (url?: string) => {
        const res = await fetch(`${API_Base}/admin/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        if (!res.ok) throw new Error('Sync failed');
        return res.json();
    },

    updateAllVisibility: async (is_public: boolean) => {
        const res = await fetch(`${API_Base}/admin/channels/visibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public })
        });
        return res.json();
    },

    togglePublic: async (id: string, is_public: boolean) => {
        const res = await fetch(`${API_Base}/channels/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public })
        });
        return res.json();
    },

    addChannel: async (channel: Partial<Channel>) => {
        const res = await fetch(`${API_Base}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(channel)
        });
        return res.json();
    },

    deleteChannel: async (id: string) => {
        await fetch(`${API_Base}/channels/${id}`, { method: 'DELETE' });
    },

    deleteAllChannels: async () => {
        const res = await fetch(`${API_Base}/admin/channels/all`, { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },

    login: async (username: string, password: string): Promise<{ token: string, message: string }> => {
        const res = await fetch(`${API_Base}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    },

    getStats: async () => {
        const res = await fetch(`${API_Base}/admin/stats`);
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },

    updateStatus: async (id: string, status: 'online' | 'offline' | 'unknown') => {
        await fetch(`${API_Base}/admin/channel/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    },

    toggleFeatured: async (id: string, is_featured: boolean) => {
        await fetch(`${API_Base}/admin/channels/${id}/feature`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_featured })
        });
    },

    getFeatured: async (): Promise<Channel[]> => {
        const res = await fetch(`${API_Base}/featured`);
        return res.json();
    },

    getPlaylists: async () => {
        const res = await fetch(`${API_Base}/admin/playlists`);
        return res.json();
    },

    addPlaylist: async (name: string, url: string) => {
        await fetch(`${API_Base}/admin/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url })
        });
    },

    deletePlaylist: async (id: string) => {
        await fetch(`${API_Base}/admin/playlists/${id}`, { method: 'DELETE' });
    }
};
