export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IStorageEventEmitter {
  dispatch(event: string, detail: unknown): void;
}
