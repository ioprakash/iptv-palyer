import { dbPromise } from './server/database';

(async () => {
    try {
        const db = await dbPromise;
        const result = await db.all("PRAGMA table_info(featured_channels);");
        console.log("featured_channels table columns:", result);
        if (result.length > 0) {
            console.log("SUCCESS: Table 'featured_channels' exists.");
        } else {
            console.error("FAILURE: Table 'featured_channels' does NOT exist.");
        }
    } catch (e) {
        console.error("Error accessing DB:", e);
    }
})();
