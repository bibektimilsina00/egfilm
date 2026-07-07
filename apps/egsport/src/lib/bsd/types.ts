/**
 * Normalised match-center view model. This is the only shape the UI knows
 * about; the BSD-specific field soup stays behind the normaliser.
 */

export type IncidentType = 'goal' | 'substitution' | 'card' | 'var' | 'period' | 'injuryTime' | 'other';

export interface MCIncident {
    minute: number | null;
    addedTime?: number | null;
    type: IncidentType;
    side: 'home' | 'away' | null;
    /** Primary actor (scorer / player carded / player coming on). */
    player?: string | null;
    /** Secondary detail (assist / player going off / VAR text / period label). */
    detail?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    card?: 'yellow' | 'red' | null;
}

export interface MCStat {
    label: string;
    home: number;
    away: number;
    /** 'percent' renders 0-100 bars; 'number' renders raw counts. */
    kind: 'percent' | 'number';
}

export interface MCPlayer {
    /** BSD player id, when known — enables linking to the player page. */
    id?: number | null;
    name: string;
    number?: string | null;
    position?: string | null;
    goals?: number;
    yellow?: boolean;
    red?: boolean;
    rating?: number | null;
}

export interface MCSide {
    name: string;
    /** BSD team id, when known — enables linking to the team page. */
    teamId: number | null;
    score: number | null;
    htScore: number | null;
    xg: number | null;
    coach: string | null;
    form: string | null;
}

export interface MatchCenter {
    found: boolean;
    eventId: number | null;
    status: string;
    statusLabel: string;
    live: boolean;
    minute: number | null;
    kickoff: string | null;
    home: MCSide;
    away: MCSide;
    venue: { name: string; city: string | null; capacity: number | null } | null;
    referee: string | null;
    possession: { home: number; away: number } | null;
    stats: MCStat[];
    incidents: MCIncident[];
    lineups: { home: MCPlayer[]; away: MCPlayer[]; homeSubs: MCPlayer[]; awaySubs: MCPlayer[] } | null;
    prediction: { home: number; draw: number; away: number } | null;
}

export const EMPTY_MATCH_CENTER: MatchCenter = {
    found: false,
    eventId: null,
    status: 'unknown',
    statusLabel: '',
    live: false,
    minute: null,
    kickoff: null,
    home: { name: '', teamId: null, score: null, htScore: null, xg: null, coach: null, form: null },
    away: { name: '', teamId: null, score: null, htScore: null, xg: null, coach: null, form: null },
    venue: null,
    referee: null,
    possession: null,
    stats: [],
    incidents: [],
    lineups: null,
    prediction: null,
};
