// Raw iptv-org API shapes (subset of fields we use).
// Source: https://iptv-org.github.io/api/*.json
export interface RawChannel {
    id: string;
    name: string;
    country: string;
    categories: string[];
    is_nsfw: boolean;
    languages?: string[];
    closed?: string | null;
    replaced_by?: string | null;
}
export interface RawStream {
    channel: string | null;
    feed?: string | null;
    url: string;
    referrer?: string | null;
    user_agent?: string | null;
    quality?: string | null;
}
export interface RawFeed {
    channel: string;
    id: string;
    languages?: string[];
}
export interface RawCategory {
    id: string;
    name: string;
}
export interface RawCountry {
    code: string;
    name: string;
    languages: string[];
    flag: string;
}
export interface RawLanguage {
    code: string;
    name: string;
}
export interface RawLogo {
    channel: string;
    url: string;
}
export interface RawBlocked {
    channel: string;
}

// Normalized shapes used by the app.
export interface TvStream {
    url: string;
    quality?: string | null;
    referrer?: string | null;
    userAgent?: string | null;
}
export interface TvCountry {
    code: string;
    name: string;
    flag: string;
}
export interface TvChannel {
    id: string;
    name: string;
    logo: string | null;
    country: TvCountry | null;
    categories: string[];
    languages: string[];
    streams: TvStream[];
    isNsfw: boolean;
}
export interface TvCategory {
    id: string;
    name: string;
    count: number;
}
export interface TvLanguage {
    code: string;
    name: string;
    count: number;
}
