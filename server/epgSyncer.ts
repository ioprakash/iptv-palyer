import { XMLParser } from 'fast-xml-parser';
import { dbPromise } from './database';
import { randomUUID } from 'crypto';

interface EPGProgram {
    channel: string; // tvg-id
    start: string; // YYYYMMDDhhmmss +0000
    stop: string;
    title: string | { '#text': string };
    desc?: string | { '#text': string };
}

export const syncEPGSource = async (sourceId: string, url: string) => {
    console.log(`Starting EPG Sync for ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch EPG: ${response.statusText}`);

        const xmlData = await response.text();
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        const jsonObj = parser.parse(xmlData);
        if (!jsonObj.tv || !jsonObj.tv.programme) {
            console.log('No programs found in EPG');
            return 0;
        }

        const programs = Array.isArray(jsonObj.tv.programme) ? jsonObj.tv.programme : [jsonObj.tv.programme];
        const db = await dbPromise;

        // Optimization: Use transaction
        await db.run('BEGIN TRANSACTION');

        // Cleanup old programs (keep last 24h + future)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // Format for SQLite comparison if stored as ISO string, but XMLTV is specific format.
        // We will convert start/stop to ISO format for easier DB querying.

        const stmt = await db.prepare(`
            INSERT OR REPLACE INTO program_guide (id, channel_id, tvg_id, start, stop, title, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        let count = 0;
        for (const prog of programs) {
            const startRaw = prog['@_start']; // YYYYMMDDhhmmss +0000
            const stopRaw = prog['@_stop'];

            // Basic parser for XMLTV date format: 20250410120000 +0000
            const parseDate = (d: string) => {
                const year = d.substring(0, 4);
                const month = d.substring(4, 6);
                const day = d.substring(6, 8);
                const hour = d.substring(8, 10);
                const minute = d.substring(10, 12);
                const second = d.substring(12, 14);
                // We'll trust the offset or assume UTC for simplicity in this MVP
                return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
            };

            const startISO = parseDate(startRaw);
            const stopISO = parseDate(stopRaw);

            // Title and Desc can be object with lang or string
            const title = typeof prog.title === 'object' ? prog.title['#text'] : prog.title;
            const desc = prog.desc ? (typeof prog.desc === 'object' ? prog.desc['#text'] : prog.desc) : '';
            const tvgId = prog['@_channel'];

            // map tvg-id to internal channel_id? 
            // Ideally we store tvg_id and join on fetch, OR lookup now. 
            // Lookup now is slower but cleaner query. Join on fetch is faster sync but complex query.
            // Let's store tvg_id directly in program_guide, and we join in the API query.

            await stmt.run(
                randomUUID(),
                null, // channel_id (linked later or unused if we rely on tvg_id)
                tvgId,
                startISO,
                stopISO,
                title,
                desc
            );
            count++;
        }

        await stmt.finalize();
        await db.run('COMMIT');

        await db.run('UPDATE epg_sources SET last_synced = CURRENT_TIMESTAMP WHERE id = ?', [sourceId]);

        console.log(`EPG Sync Complete. Imported ${count} programs.`);
        return count;

    } catch (e) {
        console.error('EPG Sync Failed', e);
        const db = await dbPromise;
        if (await dbPromise.then(d => d.get('SELECT 1'))) await (await dbPromise).run('ROLLBACK');
        throw e;
    }
};
