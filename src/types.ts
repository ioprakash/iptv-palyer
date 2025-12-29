export interface FeaturedChannel {
    id: string;
    title: string;
    type: 'hls' | 'youtube' | 'iframe';
    url: string;
    thumbnail?: string;
    sort_order: number;
    is_active: boolean;
    added_at?: string;
    is_n8n_live?: boolean;
}
