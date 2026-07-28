import type { BookmarkedTool } from '../types';
import { localStorageAdapter as storage, windowEventEmitter as events } from '../lib/storage';

const STORAGE_KEY = 'rom_bookmarks';

/** Returns all bookmarked tools from storage. */
export function getBookmarks(): BookmarkedTool[] {
    try {
        const stored = storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to read bookmarks from localStorage:', error);
        return [];
    }
}

function saveBookmarks(bookmarks: BookmarkedTool[]): void {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
        events.dispatch('bookmarks:changed', { bookmarks });
    } catch (error) {
        console.warn('Failed to save bookmarks to localStorage:', error);
    }
}

/** Checks whether a tool is bookmarked by its slug. */
export function isBookmarked(slug: string): boolean {
    if (!slug) return false;
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.slug === slug);
}

/** Adds a tool to bookmarks. Returns true if added, false if already present. */
export function addBookmark(tool: BookmarkedTool): boolean {
    if (!tool.slug) return false;

    const bookmarks = getBookmarks();
    if (!bookmarks.some(b => b.slug === tool.slug)) {
        bookmarks.push(tool);
        saveBookmarks(bookmarks);
        return true;
    }
    return false;
}

/** Removes a bookmark by slug. Returns true if removed, false if not found. */
export function removeBookmark(slug: string): boolean {
    if (!slug) return false;

    const bookmarks = getBookmarks();
    const index = bookmarks.findIndex(b => b.slug === slug);
    if (index > -1) {
        bookmarks.splice(index, 1);
        saveBookmarks(bookmarks);
        return true;
    }
    return false;
}

/** Toggles a tool's bookmark state. Returns true if now bookmarked, false if unbookmarked. */
export function toggleBookmark(tool: BookmarkedTool): boolean {
    if (isBookmarked(tool.slug)) {
        removeBookmark(tool.slug);
        return false;
    } else {
        addBookmark(tool);
        return true;
    }
}

/** Returns the full list of bookmarked tools (alias for getBookmarks). */
export function getBookmarkedTools(): BookmarkedTool[] {
    return getBookmarks();
}

/** Returns the number of bookmarked tools. */
export function getBookmarkCount(): number {
    return getBookmarks().length;
}
