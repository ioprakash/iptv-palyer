import { dbPromise } from './database';

(async () => {
    // 1. Add some dummy channels via API
    console.log('Adding dummy channels...');
    for (let i = 0; i < 3; i++) {
        await fetch('http://localhost:3001/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Delete Test ${i}`,
                url: 'http://test.com/stream.m3u8',
                is_public: false
            })
        });
    }

    // 2. Count before delete
    const db = await dbPromise;
    const countBefore = await db.get('SELECT COUNT(*) as count FROM channels');
    console.log(`Channels before delete: ${countBefore.count}`);

    if (countBefore.count === 0) {
        console.error('Failed to add channels for test.');
        return;
    }

    // 3. Call Delete Endpoint
    console.log('Calling DELETE /api/admin/channels/all...');
    const res = await fetch('http://localhost:3001/api/admin/channels/all', {
        method: 'DELETE'
    });

    if (!res.ok) {
        console.error('Delete API failed:', res.statusText);
        return;
    }

    // 4. Count after delete
    const countAfter = await db.get('SELECT COUNT(*) as count FROM channels');
    console.log(`Channels after delete: ${countAfter.count}`);

    if (countAfter.count === 0) {
        console.log('SUCCESS: All channels deleted.');
    } else {
        console.error('FAILURE: Channels still exist.');
    }

})();
