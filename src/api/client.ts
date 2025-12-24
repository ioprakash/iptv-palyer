import { Channel } from '../utils/m3uParser';

const API_Base = 'http://localhost:3001/api';

export const ApiClient = {
    getChannels: async (): Promise<Channel[]> => {
        const res = await fetch(`${API_Base}/channels`);
        return res.json();
    },

    getAllChannelsAdmin: async (page = 1, limit = 50, search = ''): Promise<{ data: Channel[], total: number, page: number, totalPages: number }> => {
        const res = await fetch(`${API_Base}/admin/channels?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
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

    login: async (username: string, password: string): Promise<{ token: string, message: string }> => {
        const res = await fetch(`${API_Base}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    }
};
