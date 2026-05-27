import type { Tool } from '../types';
import { isRecentlyAdded } from './dates';

export const toolComparators = {
    nameAsc: (a: Tool, b: Tool): number => a.title.localeCompare(b.title),
    nameDesc: (a: Tool, b: Tool): number => b.title.localeCompare(a.title),
    dateNewest: (a: Tool, b: Tool): number =>
        new Date(b['date-added'] || 0).getTime() - new Date(a['date-added'] || 0).getTime(),
    dateOldest: (a: Tool, b: Tool): number =>
        new Date(a['date-added'] || 0).getTime() - new Date(b['date-added'] || 0).getTime(),
    az: (a: Tool, b: Tool): number => a.title.localeCompare(b.title),
    za: (a: Tool, b: Tool): number => b.title.localeCompare(a.title),
    free: (a: Tool, b: Tool): number => {
        const priceRank: Record<string, number> = { 'Free': 0, 'Freemium': 1, 'From': 2, 'One-time': 3, 'Not available': 4 };
        return (priceRank[a.tag?.split(' ')[0] || ''] || 5) - (priceRank[b.tag?.split(' ')[0] || ''] || 5);
    },
    featured: (a: Tool, b: Tool): number =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
    newest: (a: Tool, b: Tool): number =>
        new Date(b['date-added'] || 0).getTime() - new Date(a['date-added'] || 0).getTime(),
    'recently-updated': (a: Tool, b: Tool): number => {
        const aDate = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a['date-added'] || 0).getTime();
        const bDate = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b['date-added'] || 0).getTime();
        return bDate - aDate;
    },
    'most-popular': (a: Tool, b: Tool): number =>
        (b.popularity_score || 0) - (a.popularity_score || 0),
    'setup-easiest': (a: Tool, b: Tool): number => {
        const rank: Record<string, number> = { Low: 0, Medium: 1, High: 2 };
        return (rank[a.setup_difficulty || 'Medium'] ?? 1) - (rank[b.setup_difficulty || 'Medium'] ?? 1);
    },
} as const;

export type SortKey = keyof typeof toolComparators | 'random';

export function sortTools(tools: Tool[], sortKey: keyof typeof toolComparators): Tool[] {
    const comparator = toolComparators[sortKey];
    return [...tools].sort(comparator);
}

export function mulberry32(seed: number): () => number {
    return function (): number {
        let a = seed;
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        seed = a;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
    const rnd = mulberry32(seed || 1);
    const result: T[] = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const temp: T = result[i] as T;
        result[i] = result[j] as T;
        result[j] = temp;
    }
    return result;
}
