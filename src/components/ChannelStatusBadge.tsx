import React, { useEffect } from 'react';
import { useChannelStatus } from '../hooks/useChannelStatus';
import { ApiClient } from '../api/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
    id: string;
    url: string;
}

export const ChannelStatusBadge: React.FC<Props> = ({ id, url }) => {
    const status = useChannelStatus(url);

    useEffect(() => {
        // Optimistically update backend with the status found by the frontend
        if (status === 'online' || status === 'offline') {
            ApiClient.updateStatus(id, status).catch(() => { });
        }
    }, [id, status]);

    if (status === 'checking') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium border border-gray-500/20">
                <Loader2 size={12} className="animate-spin" /> Checking
            </span>
        );
    }

    if (status === 'online') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                <CheckCircle2 size={12} /> Online
            </span>
        );
    }

    if (status === 'offline') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                <XCircle size={12} /> Offline
            </span>
        );
    }

    return <span className="text-gray-600 text-xs">-</span>;
};
