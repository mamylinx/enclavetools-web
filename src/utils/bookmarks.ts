import type { BookmarkedTool } from '../types';
import { localStorageAdapter as storage, windowEventEmitter as events } from '../lib/storage';

const STORAGE_KEY = 'rom_bookmarks';

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

export function isBookmarked(slug: string): boolean {
    if (!slug) return false;
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.slug === slug);
}

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

export function toggleBookmark(tool: BookmarkedTool): boolean {
    if (isBookmarked(tool.slug)) {
        removeBookmark(tool.slug);
        return false;
    } else {
        addBookmark(tool);
        return true;
    }
}

export function getBookmarkedTools(): BookmarkedTool[] {
    return getBookmarks();
}

export function getBookmarkCount(): number {
    return getBookmarks().length;
}
