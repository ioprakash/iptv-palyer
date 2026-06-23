import { randomUUID } from 'crypto';
import type { Channel } from './m3uImporter';

export const DISHHOME_PLAYLIST_URL = 'dishhome://live-tv';

const DISHHOME_LANG = 'ENG';
const DISHHOME_RAIL_ID = '43b09d05b910c4ceb0a1506be8fff8c4';
const DISHHOME_ASSET_BASE_URL = 'https://assets.dishhomego.com.np';
const DISHHOME_CHANNEL_BASE_URL = 'https://www.dishhomego.com.np/en/live_TV';

interface DishHomeImage {
    path?: string;
}

interface DishHomeMedia {
    mediaId?: string;
    rPlatform?: string;
}

interface DishHomeItem {
    id: string;
    slug?: string;
    title?: string;
    shortSynopsis?: string;
    fullSynopsis?: string;
    catogory?: string[];
    genres?: string[];
    images?: DishHomeImage[];
    media?: DishHomeMedia[];
    channelNumber?: string | number;
}

interface DishHomeRailResponse {
    list?: DishHomeItem[];
    total?: number;
}

const buildDishHomeChannelUrl = (item: DishHomeItem) => {
    const slug = item.slug || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || item.id;
    return `${DISHHOME_CHANNEL_BASE_URL}/${slug}/${item.id}`;
};

const buildDishHomeLogoUrl = (item: DishHomeItem) => {
    const imagePath = item.images?.find(image => image.path)?.path;
    if (!imagePath) return '';
    return `${DISHHOME_ASSET_BASE_URL}/${imagePath}`;
};

const buildDishHomeDescription = (item: DishHomeItem) => {
    const baseDescription = item.shortSynopsis || item.fullSynopsis || 'DishHome Go live TV channel';
    const mediaId = item.media?.find(media => media.rPlatform === 'all')?.mediaId || item.media?.[0]?.mediaId;

    return mediaId
        ? `${baseDescription} | DishHome mediaId: ${mediaId} | Opens externally and may require DishHome login.`
        : `${baseDescription} | Opens externally and may require DishHome login.`;
};

const mapDishHomeItemToChannel = (item: DishHomeItem): Channel => ({
    id: randomUUID(),
    name: item.title || 'DishHome Channel',
    logo: buildDishHomeLogoUrl(item),
    group_title: item.catogory?.[0] || item.genres?.[0] || 'DishHome',
    url: buildDishHomeChannelUrl(item),
    country: 'NP',
    type: 'external',
    is_public: false,
    description: buildDishHomeDescription(item),
});

export const fetchDishHomeChannels = async (): Promise<Channel[]> => {
    const collectedItems: DishHomeItem[] = [];
    const seenIds = new Set<string>();
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (collectedItems.length < total) {
        const url = `https://storefront.dishhomego.com.np/dhome/web-app/rail/generic/editorial-dynamic/${DISHHOME_RAIL_ID}?lang=${DISHHOME_LANG}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch DishHome channels: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as DishHomeRailResponse;
        const list = data.list || [];

        if (!list.length) break;

        total = data.total || list.length;

        for (const item of list) {
            if (!item?.id || seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            collectedItems.push(item);
        }

        page += 1;
    }

    return collectedItems.map(mapDishHomeItemToChannel);
};