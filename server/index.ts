import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dbPromise } from './database';
import { randomUUID } from 'crypto';
import { parseM3U } from './m3uImporter';

// Schema Migration: Add status and description columns if not exists
(async () => {
    const db = await dbPromise;
    try {
        await db.run("ALTER TABLE channels ADD COLUMN status TEXT DEFAULT 'unknown'");
        console.log("Added 'status' column to channels table");
    } catch (e) { /* Ignore */ }

    try {
        await db.run("ALTER TABLE channels ADD COLUMN description TEXT");
        console.log("Added 'description' column to channels table");
    } catch (e) { /* Ignore */ }

    try {
        await db.run("ALTER TABLE channels ADD COLUMN is_featured INTEGER DEFAULT 0");
        console.log("Added 'is_featured' column to channels table");
    } catch (e) { /* Ignore */ }

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT,
                url TEXT,
                enabled BOOLEAN DEFAULT 1,
                last_synced DATETIME
            )
        `);
        console.log("Ensured 'playlists' table exists");
    } catch (e) { console.error("Error creating playlists table", e); }

    try {
        await db.run("ALTER TABLE channels ADD COLUMN playlist_id TEXT");
        console.log("Added 'playlist_id' column to channels table");
    } catch (e) { /* Ignore */ }
})();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase API limit for large M3U imports

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'kabali123') {
        return res.json({ token: 'admin-token-12345', message: 'Login successful' });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

// GET Public Channels
app.get('/api/channels', async (req, res) => {
    try {
        const db = await dbPromise;
        const channels = await db.all('SELECT * FROM channels WHERE is_public = 1');
        res.json(channels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Get Dashboard Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const db = await dbPromise;
        const total = await db.get('SELECT COUNT(*) as count FROM channels');
        const publicCount = await db.get('SELECT COUNT(*) as count FROM channels WHERE is_public = 1');
        const privateCount = await db.get('SELECT COUNT(*) as count FROM channels WHERE is_public = 0');
        const online = await db.get("SELECT COUNT(*) as count FROM channels WHERE status = 'online'");
        const offline = await db.get("SELECT COUNT(*) as count FROM channels WHERE status = 'offline'");

        res.json({
            total: total.count,
            public: publicCount.count,
            private: privateCount.count,
            online: online.count,
            offline: offline.count
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Update Channel Status
app.post('/api/admin/channel/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const db = await dbPromise;
        await db.run('UPDATE channels SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: GET All Channels (Paginated)
app.get('/api/admin/channels', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const offset = (page - 1) * limit;

    try {
        const db = await dbPromise;
        const channels = await db.all(
            'SELECT * FROM channels WHERE name LIKE ? LIMIT ? OFFSET ?',
            [search, limit, offset]
        );
        const countResult = await db.get(
            'SELECT COUNT(*) as count FROM channels WHERE name LIKE ?',
            [search]
        );

        res.json({
            data: channels,
            total: countResult.count,
            page,
            totalPages: Math.ceil(countResult.count / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Import Channels
app.post('/api/admin/import', async (req, res) => {
    const { content, is_public = false } = req.body; // Default to Private if not specified
    if (!content) return res.status(400).json({ error: 'Content required' });

    try {
        const channels = parseM3U(content);
        const db = await dbPromise;

        // Batch Insert Transaction
        await db.run('BEGIN TRANSACTION');
        const stmt = await db.prepare('INSERT OR IGNORE INTO channels (id, name, url, logo, group_title, country, type, is_public, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

        for (const channel of channels) {
            // Use the requested default visibility, or the parser's result if it was explicitly set (unlikely for basic M3U)
            // For this feature, we override with the user's choice for the import batch
            const finalIsPublic = is_public;

            await stmt.run(
                channel.id,
                channel.name,
                channel.url,
                channel.logo || '',
                channel.group_title || 'General',
                channel.country || 'Unknown',
                channel.type,
                finalIsPublic,
                channel.description || ''
            );
        }
        await stmt.finalize();
        await db.run('COMMIT');

        res.json({ message: `Imported ${channels.length} channels as ${is_public ? 'Public' : 'Private'}` });
    } catch (error) {
        console.error(error);
        if (await dbPromise.then(db => db.get('SELECT 1'))) await (await dbPromise).run('ROLLBACK');
        res.status(500).json({ error: 'Import failed' });
    }
});

// ADMIN: Set Global Visibility
app.post('/api/admin/channels/visibility', async (req, res) => {
    const { is_public } = req.body;
    if (typeof is_public !== 'boolean') return res.status(400).json({ error: 'is_public boolean required' });

    try {
        const db = await dbPromise;
        await db.run('UPDATE channels SET is_public = ?', [is_public]);
        res.json({ message: `All channels set to ${is_public ? 'Public' : 'Private'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// ADMIN: Get Playlists
app.get('/api/admin/playlists', async (req, res) => {
    try {
        const db = await dbPromise;
        const playlists = await db.all('SELECT * FROM playlists');
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Add Playlist
app.post('/api/admin/playlists', async (req, res) => {
    const { name, url } = req.body;
    const id = randomUUID();
    try {
        const db = await dbPromise;
        await db.run('INSERT INTO playlists (id, name, url) VALUES (?, ?, ?)', [id, name, url]);
        res.json({ message: 'Playlist added', id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add playlist' });
    }
});

// ADMIN: Delete Playlist
app.delete('/api/admin/playlists/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM playlists WHERE id = ?', [id]);
        await db.run('DELETE FROM channels WHERE playlist_id = ?', [id]); // Optional: Delete channels from this playlist?
        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete playlist' });
    }
});

// ADMIN: Sync All Playlists (Smart Sync)
app.post('/api/admin/sync', async (req, res) => {
    try {
        const db = await dbPromise;
        const playlists = await db.all('SELECT * FROM playlists WHERE enabled = 1');

        let totalAdded = 0;

        for (const playlist of playlists) {
            console.log(`Syncing playlist: ${playlist.name} (${playlist.url})`);
            try {
                const response = await fetch(playlist.url);
                if (!response.ok) {
                    // console.error(`Failed to fetch ${playlist.url}`);
                    continue;
                }
                const text = await response.text();
                const channels = parseM3U(text);

                for (const channel of channels) {
                    const existing = await db.get('SELECT id FROM channels WHERE url = ?', [channel.url]);

                    if (existing) {
                        await db.run(
                            `UPDATE channels SET name = ?, logo = ?, group_title = ?, country = ?, playlist_id = ? WHERE id = ?`,
                            [channel.name, channel.logo, channel.group, channel.country, playlist.id, existing.id]
                        );
                    } else {
                        await db.run(
                            `INSERT INTO channels (id, name, url, logo, group_title, country, type, is_public, playlist_id)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [randomUUID(), channel.name, channel.url, channel.logo, channel.group, channel.country, 'hls', 0, playlist.id]
                        );
                        totalAdded++;
                    }
                }

                await db.run('UPDATE playlists SET last_synced = CURRENT_TIMESTAMP WHERE id = ?', [playlist.id]);

            } catch (err) {
                console.error(`Error syncing playlist ${playlist.name}:`, err);
            }
        }

        res.json({ message: `Sync complete. Added ${totalAdded} new channels.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Sync failed' });
    }
});


// ADMIN: Add Channel
app.post('/api/channels', async (req, res) => {
    const { name, url, logo, group_title, country, type, is_public = false } = req.body;
    if (!name || !url) {
        res.status(400).json({ error: 'Name and URL are required' });
        return;
    }

    try {
        const db = await dbPromise;
        const id = randomUUID();
        await db.run(
            `INSERT INTO channels (id, name, url, logo, group_title, country, type, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, url, logo || '', group_title || 'General', country || 'Unknown', type || 'hls', is_public]
        );
        res.status(201).json({ id, message: 'Channel added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add channel' });
    }
});

// ADMIN: Update Channel (Toggle Public)
app.patch('/api/channels/:id', async (req, res) => {
    const { id } = req.params;
    const { is_public } = req.body;

    try {
        const db = await dbPromise;
        await db.run('UPDATE channels SET is_public = ? WHERE id = ?', [is_public, id]);
        res.json({ message: 'Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// ADMIN: Delete All Channels
app.delete('/api/admin/channels/all', async (req, res) => {
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM channels');
        // Reset sqlite sequence for auto-increment if used, though UUIDs are used here.
        // Vacuum to reclaim space? Maybe overkill for now.
        res.json({ message: 'All channels deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete all channels' });
    }
});

// ADMIN: Delete Channel
app.delete('/api/channels/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM channels WHERE id = ?', id);
        res.json({ message: 'Channel deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

// ADMIN: Featured Toggle
app.patch('/api/admin/channels/:id/feature', async (req, res) => {
    const { id } = req.params;
    const { is_featured } = req.body;
    try {
        const db = await dbPromise;
        await db.run('UPDATE channels SET is_featured = ? WHERE id = ?', [is_featured ? 1 : 0, id]);
        res.json({ message: 'Updated featured status' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// PUBLIC: Get Featured Channels
app.get('/api/featured', async (req, res) => {
    try {
        const db = await dbPromise;
        const channels = await db.all('SELECT * FROM channels WHERE is_featured = 1 AND is_public = 1 LIMIT 6');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
