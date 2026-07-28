import type {
  ToolCore,
  ToolDiscovery,
  ToolCapabilities,
  ToolHardware,
  ToolCommunity,
} from './tool-parts';

/** Complete Tool model — merges all part interfaces. */
export interface Tool extends ToolCore, ToolDiscovery, ToolCapabilities, ToolHardware, ToolCommunity {}

export type { ToolCore, ToolDiscovery, ToolCapabilities, ToolHardware, ToolCommunity } from './tool-parts';

/** A Tool with at least one category (may be string or array after normalization). */
export interface ToolWithCategory extends Tool {
  category: string | string[];
}

/** A saved/bookmarked Tool, guaranteed to have a single category. */
export interface BookmarkedTool extends Tool {
  category: string;
}

/** A category bucket containing its Tools. */
export interface Category {
  category: string;
  title: string;
  content: Tool[];
}

/** Top-level config shape for the tools data file. */
export interface ToolsConfig {
  tools: Category[];
}

/** Result of running filter + search across tools. */
export interface FilterResult {
  tools: Tool[];
  total: number;
}
