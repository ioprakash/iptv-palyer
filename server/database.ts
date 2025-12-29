import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const dbPromise = open({
    filename: './channels.db',
    driver: sqlite3.Database
});

const initDB = async () => {
    const db = await dbPromise;
    await db.exec(`
        CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT,
            url TEXT,
            logo TEXT,
            group_title TEXT,
            country TEXT,
            type TEXT DEFAULT 'hls',
            is_public BOOLEAN DEFAULT 1,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        -- Clean up duplicates before creating index
        DELETE FROM channels WHERE rowid NOT IN (
            SELECT MIN(rowid) FROM channels GROUP BY url
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_url ON channels(url);
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS featured_channels (
            id TEXT PRIMARY KEY,
            title TEXT,
            type TEXT CHECK(type IN ('hls', 'youtube', 'iframe')),
            url TEXT,
            thumbnail TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Database Initialized');
};

initDB();
