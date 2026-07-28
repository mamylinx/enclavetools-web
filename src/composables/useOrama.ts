import { create, load, search } from '@orama/orama';
import type { ToolWithCategory } from '../utils/toolModel';
import { toolComparators } from '../utils/sorting';
import { postFilter } from './oramaFilters';
import { SCHEMA } from './oramaSchema';
import type { FilterState } from '../interfaces/tool';

let oramaInstance: ReturnType<typeof create> extends Promise<infer T> ? T : never | null = null;
let loadingPromise: Promise<void> | null = null;

async function getOrama() {
  if (oramaInstance) return oramaInstance;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const res = await fetch('/search-index.json');
      const data = await res.json();
      oramaInstance = await create({ schema: SCHEMA });
      await load(oramaInstance, data);
    })();
  }
  await loadingPromise;
  return oramaInstance;
}

/** Parameters for a full Orama search query. */
export type OramaSearchParams = {
  urlCategory: string;
  filters: FilterState;
  term?: string;
  sort?: string;
  limit?: number;
  offset?: number;
};

/** Result of an Orama search: matching tools slice and total count. */
export type OramaSearchResult = {
  tools: ToolWithCategory[];
  total: number;
};

/** Full-text search over tools via Orama, with post-filtering, sorting, and pagination. */
export async function searchTools(params: OramaSearchParams): Promise<OramaSearchResult> {
  const db = await getOrama();

  const where: Record<string, unknown> = {};

  if (params.filters.commercial_use === 'yes') where.commercial_use = true;
  if (params.filters.offline_after_setup === 'yes') where.offline_after_setup = true;
  if (params.filters.telemetry === 'None') where.telemetry = 'None';
  for (const feat of params.filters.features) {
    where[feat] = true;
  }

  const searchOpts: Record<string, unknown> = {
    limit: 1000,
    offset: 0,
  };

  if (params.term && params.term.trim()) {
    searchOpts.term = params.term.trim();
    searchOpts.properties = ['title', 'plain_description'];
    searchOpts.boost = { title: 3 };
    searchOpts.where = where as Record<string, unknown>;
  } else {
    searchOpts.where = where as Record<string, unknown>;
  }

  const results = await search(db, searchOpts);

  let tools = results.hits.map((h: { document: Record<string, unknown> }) => h.document as unknown as ToolWithCategory);

  tools = postFilter(tools, params.filters);

  if (params.urlCategory !== 'all') {
    tools = tools.filter((tool) => {
      const cats = Array.isArray(tool.category) ? tool.category : [tool.category];
      return cats.includes(params.urlCategory);
    });
  }

  const sortKey = params.sort as keyof typeof toolComparators;
  if (sortKey && toolComparators[sortKey]) {
    tools = [...tools].sort(toolComparators[sortKey]);
  }

  const total = tools.length;
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;
  tools = tools.slice(offset, offset + limit);

  return { tools, total };
}

/** Quick search returning a small set of results for the dropdown suggest. */
export async function searchDropdown(term: string) {
  const db = await getOrama();

  const results = await search(db, {
    term,
    properties: ['title', 'plain_description'],
    boost: { title: 3 },
    limit: 8,
    threshold: 0.3,
  });

  return results.hits.map((h: { document: Record<string, unknown> }) => ({
    title: h.document.title as string,
    slug: h.document.slug as string,
    category: Array.isArray(h.document.category) ? (h.document.category as string[])[0] : h.document.category as string,
    plain_description: (h.document.plain_description as string) || '',
  }));
}
