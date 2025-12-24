export interface Channel {
    id: string;
    name: string;
    logo?: string;
    group?: string;
    url: string;
    country?: string;
    description?: string;
    language?: string;
    quality?: 'SD' | 'HD' | 'FHD' | '4K';
    type?: 'hls' | 'youtube' | 'iframe';
    is_public?: boolean;
    is_featured?: boolean; // 0 or 1 in DB, boolean in app
}

export const parseM3U = (content: string): Channel[] => {
    const lines = content.split('\n');
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> = {};

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            // Extract raw attributes
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            if (logoMatch) currentChannel.logo = logoMatch[1];

            const groupMatch = line.match(/group-title="([^"]*)"/);
            if (groupMatch) currentChannel.group = groupMatch[1];

            const countryMatch = line.match(/tvg-country="([^"]*)"/);
            if (countryMatch) currentChannel.country = countryMatch[1];

            const languageMatch = line.match(/tvg-language="([^"]*)"/);
            if (languageMatch) currentChannel.language = languageMatch[1];

            // Parse name (last part after comma)
            const parts = line.split(',');
            const name = parts[parts.length - 1].trim();
            currentChannel.name = name;

            // Detect Quality
            if (name.includes('4K') || name.includes('UHD')) currentChannel.quality = '4K';
            else if (name.includes('FHD') || name.includes('1080')) currentChannel.quality = 'FHD';
            else if (name.includes('HD') || name.includes('720')) currentChannel.quality = 'HD';
            else currentChannel.quality = 'SD';

        } else if (!line.startsWith('#')) {
            // It's the URL
            currentChannel.url = line;
            currentChannel.id = crypto.randomUUID();

            if (currentChannel.name && currentChannel.url) {
                channels.push(currentChannel as Channel);
            }
            currentChannel = {};
        }
    }

    return channels;
};

