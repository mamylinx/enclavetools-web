import type { IStorage, IStorageEventEmitter } from '../interfaces/storage';

/** Wraps localStorage with null-safe get/set/remove methods. */
export const localStorageAdapter: IStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

/** Dispatches custom events on window for cross-component communication. */
export const windowEventEmitter: IStorageEventEmitter = {
  dispatch: (event, detail) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }
  },
};
