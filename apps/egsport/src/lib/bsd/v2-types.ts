/**
 * Normalised BSD v2 view models for players and teams. These stay small and
 * UI-facing; the raw API responses carry many more fields we don't surface yet.
 */

export interface PlayerListItem {
    id: number;
    name: string;
    shortName: string | null;
    position: string | null;
    specificPosition: string | null;
    jerseyNumber: string | null;
    nationality: string | null;
    currentTeamId: number | null;
    marketValueEur: number | null;
    rating: number | null;
}

export interface PlayerDetail extends PlayerListItem {
    dateOfBirth: string | null;
    heightCm: number | null;
    weightKg: number | null;
    preferredFoot: string | null;
    nationalTeamId: number | null;
    contractUntil: string | null;
    availability: string | null;
    potential: number | null;
    injuryRisk: string | null;
    wageEurAnnual: number | null;
    strengths: string[];
    weaknesses: string[];
    attributes: Record<string, number> | null;
    team: TeamListItem | null;
    stats: PlayerStatLine[];
    career: CareerEntry[];
    transfers: TransferEntry[];
}

export interface PlayerStatLine {
    competition: string | null;
    season: string | null;
    appearances: number | null;
    goals: number | null;
    assists: number | null;
    minutes: number | null;
    yellow: number | null;
    red: number | null;
    rating: number | null;
}

export interface CareerEntry {
    team: string | null;
    from: string | null;
    to: string | null;
    appearances: number | null;
    goals: number | null;
}

export interface TransferEntry {
    date: string | null;
    from: string | null;
    to: string | null;
    fee: string | null;
    type: string | null;
}

export interface TeamListItem {
    id: number;
    name: string;
    shortName: string | null;
    country: string | null;
    venueId: number | null;
}

export interface SquadPlayer {
    id: number;
    name: string;
    position: string | null;
    jerseyNumber: string | null;
    nationality: string | null;
    marketValueEur: number | null;
}

export interface TeamFixture {
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    date: string | null;
    status: string | null;
    league: string | null;
    category?: string;
}

export interface Venue {
    id: number;
    name: string;
    city: string | null;
    country: string | null;
    capacity: number | null;
    builtYear: number | null;
}

export interface TeamDetail extends TeamListItem {
    venue: Venue | null;
    squad: SquadPlayer[];
    fixtures: TeamFixture[];
}

export interface Paged<T> {
    count: number;
    results: T[];
}
