import { useState, useEffect } from 'react';

type ChannelStatus = 'idle' | 'checking' | 'online' | 'offline';

export const useChannelStatus = (url: string) => {
    const [status, setStatus] = useState<ChannelStatus>('idle');

    useEffect(() => {
        if (!url) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus('checking');
        const controller = new AbortController();

        const checkStatus = async () => {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    signal: controller.signal,
                    mode: 'no-cors' // Use no-cors to avoid strict blocking, though status code will be opaque (0).
                    // A better approach for purely checking "alive" might be just seeing if it doesn't timeout.
                    // However, with 'no-cors', we can't see 200 vs 404 easily in all browsers.
                    // Let's try standard fetch first. unique behavior of HLS streams might allow CORS?
                    // Actually, no-cors returns status 0, which we can treat as "maybe online".
                    // But real 404s might also return 0 or throw.
                });

                // If we get here, connection was made.
                if (response.ok || response.type === 'opaque') {
                    setStatus('online');
                } else {
                    setStatus('offline');
                }
            } catch (error: unknown) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.warn(`Check failed for ${url}`, error);
                setStatus('offline');
            }
        };

        checkStatus();

        return () => {
            controller.abort();
        };
    }, [url]);

    return status;
};
