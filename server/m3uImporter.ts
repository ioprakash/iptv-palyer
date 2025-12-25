import { randomUUID } from 'crypto';

export interface Channel {
    id: string;
    name: string;
    logo?: string;
    group_title?: string;
    url: string;
    country?: string;
    language?: string;
    quality?: 'SD' | 'HD' | 'FHD' | '4K';
    type: 'hls' | 'youtube' | 'iframe';
    is_public: boolean;
}

export const parseM3U = (content: string): Channel[] => {
    const lines = content.split('\n');
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> = {};

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:') || line.startsWith('# EXTINF:')) {
            // Safe Initialization
            currentChannel = { is_public: false, type: 'hls' }; // Default to hidden

            // Extract attributes
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            if (logoMatch && logoMatch[1]) currentChannel.logo = logoMatch[1];

            const groupMatch = line.match(/group-title="([^"]*)"/);
            if (groupMatch && groupMatch[1]) currentChannel.group_title = groupMatch[1]; // server uses group_title

            const countryMatch = line.match(/tvg-country="([^"]*)"/);
            if (countryMatch && countryMatch[1]) currentChannel.country = countryMatch[1];

            // Parse Name
            const parts = line.split(',');
            if (parts.length > 0) {
                const name = parts[parts.length - 1].trim();
                currentChannel.name = name;

                // Detect Quality
                if (name.includes('4K') || name.includes('UHD')) currentChannel.quality = '4K';
                else if (name.includes('FHD') || name.includes('1080')) currentChannel.quality = 'FHD';
                else if (name.includes('HD') || name.includes('720')) currentChannel.quality = 'HD';
                else currentChannel.quality = 'SD';
            }

        } else if (!line.trim().startsWith('#')) {
            // It's the URL
            currentChannel.url = line;
            currentChannel.id = randomUUID();

            // Detect YouTube
            if (line.includes('youtube.com') || line.includes('youtu.be')) {
                currentChannel.type = 'youtube';
            }

            if (currentChannel.name && currentChannel.url) {
                channels.push(currentChannel as Channel);
            }
            currentChannel = {};
        }
    }

    return channels;
};
