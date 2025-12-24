import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dbPromise } from './database';
import { randomUUID } from 'crypto';
import { parseM3U } from './m3uImporter';

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
        const stmt = await db.prepare('INSERT OR IGNORE INTO channels (id, name, url, logo, group_title, country, type, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

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
                finalIsPublic
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

// ADMIN: Sync with IPTV-Org or Custom URL
app.post('/api/admin/sync', async (req, res) => {
    try {
        const { url = 'https://iptv-org.github.io/iptv/index.m3u' } = req.body;
        console.log(`Starting Sync from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch playlist');
        const text = await response.text();
        const channels = parseM3U(text);

        const db = await dbPromise;
        await db.run('BEGIN TRANSACTION');

        // UPSERT Logic:
        // 1. Insert new channels as PRIVATE (by default in schema, or explicit check)
        // 2. Update existing channels metadata
        // 3. DO NOT touch is_public for existing channels

        const stmt = await db.prepare(`
            INSERT INTO channels (id, name, url, logo, group_title, country, type, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            ON CONFLICT(url) DO UPDATE SET
                name = excluded.name,
                logo = excluded.logo,
                group_title = excluded.group_title,
                country = excluded.country,
                type = excluded.type
                -- is_public is PRESERVED
        `);

        // Process in chunks to avoid blowing up memory/transaction limits if needed, 
        // but 30k is manageable in one go for SQLite usually.
        for (const channel of channels) {
            await stmt.run(
                channel.id, // ID might change if URL same but ID logic differs? ID is generated from URL hash usually or random. 
                // If we match on URL, ID in DB is source of truth? 
                // Wait, if we match on URL, we should probably keep the OLD ID?
                // Actually, INSERT OR IGNORE and then UPDATE would be better but ON CONFLICT handles it.
                // If URL matches, 'id' in VALUES is ignored for the ROW, but we aren't updating ID. Good.
                channel.name,
                channel.url,
                channel.logo || '',
                channel.group_title || 'General',
                channel.country || 'Unknown',
                channel.type
            );
        }

        await stmt.finalize();
        await db.run('COMMIT');

        res.json({ message: `Synced ${channels.length} channels successfully` });
    } catch (error) {
        console.error('Sync failed:', error);
        if (await dbPromise.then(db => db.get('SELECT 1'))) await (await dbPromise).run('ROLLBACK');
        res.status(500).json({ error: 'Sync failed' });
    }
});

// ADMIN: Add Channel
app.post('/api/channels', async (req, res) => {
    const { name, url, logo, group_title, country, type, is_public = true } = req.body;
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
