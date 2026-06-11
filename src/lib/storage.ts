import type { IStorage, IStorageEventEmitter } from '../interfaces/storage';

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

export const windowEventEmitter: IStorageEventEmitter = {
  dispatch: (event, detail) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }
  },
};
