import { dbPromise } from './database';
import { randomUUID } from 'crypto';

(async () => {
    const db = await dbPromise;

    // Simulate what the API does:
    // We want to test that the DEFAULT is_public is 0 if not provided.
    // However, the API endpoint '/api/channels' uses the destructured default value in the route handler.
    // So testing the DB directly doesn't test the API route logic.
    // We should use fetch to call the API.

    try {
        const res = await fetch('http://localhost:3001/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Private Default Node',
                url: 'http://test.com/stream.m3u8'
                // is_public is OMITTED, should default to false (0)
            })
        });

        if (!res.ok) {
            console.error('API Error:', res.statusText);
            return;
        }

        const data = await res.json();
        const id = (data as any).id;
        console.log(`Added channel ID: ${id}`);

        const channel = await db.get('SELECT * FROM channels WHERE id = ?', id);
        console.log('Channel from DB:', JSON.stringify(channel, null, 2));

        if (channel.is_public === 0) {
            console.log('SUCCESS: Channel is private by default.');
        } else {
            console.log('FAILURE: Channel is public (is_public=' + channel.is_public + ')');
        }

    } catch (e) {
        console.error(e);
    }
})();
