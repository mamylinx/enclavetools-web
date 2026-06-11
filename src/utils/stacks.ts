import { localStorageAdapter as storage, windowEventEmitter as events } from '../lib/storage';

const STORAGE_KEY = 'enclavetools-stacks';
const ACTIVE_KEY = 'enclavetools-active-stack';
const LEGACY_KEY = 'enclavetools-stack';
const MAX_TOOLS = 8;
const MAX_NAME_LENGTH = 30;

export interface StoredStack {
  id: string;
  name: string;
  tools: string[];
  created: string;
  updated: string;
}

function id(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

function read(): StoredStack[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(stacks: StoredStack[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(stacks));
  events.dispatch('stacks:changed', { stacks });
}

function migrate(): void {
  try {
    const legacy = storage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const tools = JSON.parse(legacy);
    storage.removeItem(LEGACY_KEY);
    if (!Array.isArray(tools) || !tools.length) return;
    const existing = read();
    if (existing.length) return;
    const ts = now();
    write([{ id: 'default', name: 'My Stack', tools: tools.slice(0, MAX_TOOLS), created: ts, updated: ts }]);
    storage.setItem(ACTIVE_KEY, 'default');
  } catch {
    /* silent */
  }
}

export function getAll(): StoredStack[] {
  migrate();
  return read();
}

export function get(id: string): StoredStack | undefined {
  return getAll().find((s) => s.id === id);
}

export function create(name: string): StoredStack {
  const stacks = getAll();
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH) || 'New Stack';
  const stack: StoredStack = { id: id(), name: trimmed, tools: [], created: now(), updated: now() };
  stacks.push(stack);
  write(stacks);
  setActive(stack.id);
  return stack;
}

export function remove(id: string): void {
  let stacks = getAll();
  stacks = stacks.filter((s) => s.id !== id);
  write(stacks);
  if (getActive() === id) {
    const next = stacks[0]?.id || null;
    if (next) setActive(next);
    else storage.removeItem(ACTIVE_KEY);
  }
}

export function rename(id: string, name: string): StoredStack | undefined {
  const stacks = getAll();
  const stack = stacks.find((s) => s.id === id);
  if (!stack) return;
  stack.name = name.trim().slice(0, MAX_NAME_LENGTH) || 'Unnamed';
  stack.updated = now();
  write(stacks);
  return stack;
}

export function duplicate(id: string): StoredStack | undefined {
  const original = get(id);
  if (!original) return;
  const base = original.name.replace(/\s*\(copy\s*\d*\)\s*$/, '').trim();
  const stacks = getAll();
  let copyName = `${base} (copy)`;
  const copies = stacks.filter((s) => s.name.startsWith(base) && /\(copy(\s+\d+)?\)/.test(s.name)).length;
  if (copies > 0) copyName = `${base} (copy ${copies + 1})`;
  const stack: StoredStack = {
    id: id(), name: copyName.slice(0, MAX_NAME_LENGTH), tools: [...original.tools], created: now(), updated: now(),
  };
  stacks.push(stack);
  write(stacks);
  return stack;
}

export function addTool(id: string, slug: string): boolean {
  const stacks = getAll();
  const stack = stacks.find((s) => s.id === id);
  if (!stack || stack.tools.includes(slug) || stack.tools.length >= MAX_TOOLS) return false;
  stack.tools.push(slug);
  stack.updated = now();
  write(stacks);
  return true;
}

export function removeTool(id: string, slug: string): boolean {
  const stacks = getAll();
  const stack = stacks.find((s) => s.id === id);
  if (!stack) return false;
  const idx = stack.tools.indexOf(slug);
  if (idx === -1) return false;
  stack.tools.splice(idx, 1);
  stack.updated = now();
  write(stacks);
  return true;
}

export function getActive(): string | null {
  return storage.getItem(ACTIVE_KEY);
}

export function setActive(id: string): void {
  storage.setItem(ACTIVE_KEY, id);
}

export function getActiveStack(): StoredStack | undefined {
  const a = getActive();
  return a ? get(a) : undefined;
}

export function toolCount(id: string): number {
  return get(id)?.tools.length || 0;
}

export function ensureDefault(): StoredStack {
  const a = getActiveStack();
  if (a) return a;
  const all = getAll();
  if (all.length) {
    setActive(all[0].id);
    return all[0];
  }
  return create('My Stack');
}
