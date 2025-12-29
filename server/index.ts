import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dbPromise } from './database';
import { randomUUID } from 'crypto';
import { parseM3U } from './m3uImporter';
import { syncEPGSource } from './epgSyncer';

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

    try {
        await db.run("ALTER TABLE playlists ADD COLUMN channel_count INTEGER DEFAULT 0");
        console.log("Added 'channel_count' column to playlists table");
    } catch (e) { /* Ignore */ }

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS epg_sources (
                id TEXT PRIMARY KEY,
                name TEXT,
                url TEXT,
                enabled BOOLEAN DEFAULT 1,
                last_synced DATETIME
            )
        `);
        console.log("Ensured 'epg_sources' table exists");
    } catch (e) { console.error("Error creating epg_sources", e); }

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS program_guide (
                id TEXT PRIMARY KEY,
                channel_id TEXT,
                tvg_id TEXT,
                start DATETIME,
                stop DATETIME,
                title TEXT,
                description TEXT
            )
        `);
        // Index for faster lookups
        await db.run("CREATE INDEX IF NOT EXISTS idx_program_tvg_start ON program_guide(tvg_id, start)");
        console.log("Ensured 'program_guide' table exists");
    } catch (e) { console.error("Error creating program_guide", e); }

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS featured_channels (
                id TEXT PRIMARY KEY,
                title TEXT,
                type TEXT,
                url TEXT,
                thumbnail TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Ensured 'featured_channels' table exists");
    } catch (e) { console.error("Error creating featured_channels", e); }

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS n8n_live_streams (
                id TEXT PRIMARY KEY,
                title TEXT,
                type TEXT,
                url TEXT,
                thumbnail TEXT,
                is_active BOOLEAN DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Ensured 'n8n_live_streams' table exists");
    } catch (e) { console.error("Error creating n8n_live_streams", e); }
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
    const country = req.query.country as string;
    const group = req.query.group as string;
    const offset = (page - 1) * limit;

    try {
        const db = await dbPromise;
        let query = 'SELECT * FROM channels WHERE name LIKE ?';
        let countQuery = 'SELECT COUNT(*) as count FROM channels WHERE name LIKE ?';
        const params: any[] = [search];

        if (country) {
            query += ' AND country = ?';
            countQuery += ' AND country = ?';
            params.push(country);
        }

        if (group) {
            query += ' AND group_title = ?';
            countQuery += ' AND group_title = ?';
            params.push(group);
        }

        query += ' LIMIT ? OFFSET ?';

        const channels = await db.all(query, [...params, limit, offset]);
        const countResult = await db.get(countQuery, params);

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
                // console.log(`Fetched ${text.length} chars from ${playlist.url}`);
                const channels = parseM3U(text);
                console.log(`Parsed ${channels.length} channels from ${playlist.name}`);

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

                const channelCount = channels.length;
                await db.run('UPDATE playlists SET last_synced = CURRENT_TIMESTAMP, channel_count = ? WHERE id = ?', [channelCount, playlist.id]);
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
        const channels = await db.all('SELECT * FROM channels WHERE is_featured = 1 AND is_public = 1 LIMIT 12');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: IPTV-Org Proxy - Countries
app.get('/api/admin/iptv-org/countries', async (req, res) => {
    try {
        const response = await fetch('https://iptv-org.github.io/api/countries.json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
});

// ADMIN: IPTV-Org Proxy - Categories
app.get('/api/admin/iptv-org/categories', async (req, res) => {
    try {
        const response = await fetch('https://iptv-org.github.io/api/categories.json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// FEATURED CHANNELS (Landing Page Playlist)

// GET Public Featured Channels (Ordered)
app.get('/api/featured-channels', async (req, res) => {
    try {
        const db = await dbPromise;

        // Fetch N8N Live Stream (if active)
        const n8nStream = await db.get('SELECT * FROM n8n_live_streams WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1');

        // Fetch Regular Featured Channels
        const channels = await db.all('SELECT * FROM featured_channels WHERE is_active = 1 ORDER BY sort_order ASC, added_at DESC');

        if (n8nStream) {
            // Prepend N8N stream with a special flag
            const liveStream = {
                ...n8nStream,
                id: 'n8n-live', // Fixed ID or use existing to identify on frontend
                is_n8n_live: true
            };
            res.json([liveStream, ...channels]);
        } else {
            res.json(channels);
        }
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// N8N/Webhook Endpoint to Update Live Stream
app.post('/api/n8n/live', async (req, res) => {
    const { title, url, type = 'hls', thumbnail = '', is_active = true } = req.body;

    // Simple authentication (optional, but recommended)
    // const authHeader = req.headers['authorization'];
    // if (authHeader !== 'Bearer YOUR_SECRET_TOKEN') return res.status(401).json({ error: 'Unauthorized' });

    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const db = await dbPromise;
        // Upsert the single N8N live stream entry (we keep only one 'latest' or use a fixed ID)
        const id = 'n8n-stream-1';

        await db.run(`
            INSERT INTO n8n_live_streams (id, title, url, type, thumbnail, is_active, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            url = excluded.url,
            type = excluded.type,
            thumbnail = excluded.thumbnail,
            is_active = excluded.is_active,
            updated_at = CURRENT_TIMESTAMP
        `, [id, title || 'Live Event', url, type, thumbnail, is_active ? 1 : 0]);

        res.json({ success: true, message: 'Live stream updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Get All Featured Channels
app.get('/api/admin/featured-channels', async (req, res) => {
    try {
        const db = await dbPromise;
        const channels = await db.all('SELECT * FROM featured_channels ORDER BY sort_order ASC, added_at DESC');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN: Add Featured Channel
app.post('/api/admin/featured-channels', async (req, res) => {
    const { title, type, url, thumbnail, sort_order, is_active } = req.body;
    if (!title || !url || !type) return res.status(400).json({ error: 'Title, URL, and Type are required' });

    const id = randomUUID();
    try {
        const db = await dbPromise;
        await db.run(
            `INSERT INTO featured_channels (id, title, type, url, thumbnail, sort_order, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, title, type, url, thumbnail || '', sort_order || 0, is_active ? 1 : 0]
        );
        res.json({ message: 'Featured channel added', id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add featured channel' });
    }
});

// ADMIN: Update Featured Channel
app.put('/api/admin/featured-channels/:id', async (req, res) => {
    const { id } = req.params;
    const { title, type, url, thumbnail, sort_order, is_active } = req.body;

    try {
        const db = await dbPromise;
        await db.run(
            `UPDATE featured_channels 
             SET title = ?, type = ?, url = ?, thumbnail = ?, sort_order = ?, is_active = ?
             WHERE id = ?`,
            [title, type, url, thumbnail, sort_order, is_active ? 1 : 0, id]
        );
        res.json({ message: 'Featured channel updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update featured channel' });
    }
});

// ADMIN: Delete Featured Channel
app.delete('/api/admin/featured-channels/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM featured_channels WHERE id = ?', [id]);
        res.json({ message: 'Featured channel deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete featured channel' });
    }
});


// ADMIN: EPG Source Management
app.get('/api/admin/epg/sources', async (req, res) => {
    try {
        const db = await dbPromise;
        const sources = await db.all('SELECT * FROM epg_sources');
        res.json(sources);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/admin/epg/sources', async (req, res) => {
    const { name, url } = req.body;
    const id = randomUUID();
    try {
        const db = await dbPromise;
        await db.run('INSERT INTO epg_sources (id, name, url) VALUES (?, ?, ?)', [id, name, url]);
        res.json({ message: 'EPG Source added', id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add source' });
    }
});

app.delete('/api/admin/epg/sources/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM epg_sources WHERE id = ?', [id]);
        res.json({ message: 'EPG Source deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete source' });
    }
});

// ADMIN: Trigger EPG Sync
app.post('/api/admin/epg/sync', async (req, res) => {
    try {
        const db = await dbPromise;
        const sources = await db.all('SELECT * FROM epg_sources WHERE enabled = 1');

        let totalPrograms = 0;
        for (const source of sources) {
            totalPrograms += await syncEPGSource(source.id, source.url);
        }

        res.json({ message: `EPG Sync Complete. Total Programs: ${totalPrograms}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'EPG Sync failed' });
    }
});

// Serve Static Frontend (Production)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from ../dist
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
