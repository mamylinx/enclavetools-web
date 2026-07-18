import { store } from './store';
import { GPU_CATALOG } from './data';
import { renderResults } from './render-results';
import type { GpuRow } from '../../interfaces/llm-calculator';

/** Populate the GPU catalog <select> grouped by vendor/segment. */
export function populateCatalog(): void {
  const sel = document.getElementById('gpuCatalogSelect') as HTMLSelectElement | null;
  if (!sel) return;
  let lastGroup = '';
  GPU_CATALOG.forEach((g, i) => {
    if (g.group !== lastGroup) {
      const og = document.createElement('optgroup');
      og.label = g.group;
      sel.appendChild(og);
      lastGroup = g.group;
    }
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${g.name}  (${g.vram} GB)`;
    sel.lastChild!.appendChild(opt);
  });
}

/** Step 5: add the selected catalog GPU as a new row. */
export function addFromCatalog(): void {
  const sel = document.getElementById('gpuCatalogSelect') as HTMLSelectElement;
  const idx = sel.value;
  if (idx === '') return;
  const g = GPU_CATALOG[parseInt(idx)];
  if (!g) return;
  addGpuRow(g.name, String(g.vram), '', '', g.note);
  sel.value = '';
}

/** Step 5: add a GPU row (from catalog or manual). */
export function addGpuRow(name = '', vram = '', price = '', opex = '', note = ''): void {
  const id = ++store.gpuIdCounter;
  store.gpuRows.push(id);
  document.getElementById('gpuTableWrap')!.classList.remove('hidden');
  const tbody = document.getElementById('gpuBody')!;
  const tr = document.createElement('tr');
  tr.id = 'gpu-row-' + id;
  tr.innerHTML = `
    <td>
      <input class="gpu-input" id="gn-${id}" type="text" placeholder="GPU name" value="${name}" data-input="renderResults" />
      ${note ? `<div class="text-[11px] text-brand-muted mt-1">${note}</div>` : ''}
    </td>
    <td><input class="gpu-input" id="gv-${id}" type="number" placeholder="GB" min="1" max="2000" value="${vram}" data-input="renderResults" /></td>
    <td><input class="gpu-input" id="gp-${id}" type="number" placeholder="e.g. 30000" min="0" value="${price}" data-input="renderResults" /></td>
    <td><input class="gpu-input" id="go-${id}" type="number" placeholder="e.g. 5000" min="0" value="${opex}" data-input="renderResults" /></td>
    <td><button class="btn-sm danger" data-action="removeGpuRow" data-id="${id}">✕</button></td>`;
  tbody.appendChild(tr);
  renderResults();
}

/** Step 5: remove a GPU row by id. */
export function removeGpuRow(id: number): void {
  store.gpuRows = store.gpuRows.filter(r => r !== id);
  const el = document.getElementById('gpu-row-' + id);
  if (el) el.remove();
  if (store.gpuRows.length === 0) document.getElementById('gpuTableWrap')!.classList.add('hidden');
  renderResults();
}

/** Read all GPU rows' current values from the DOM. */
export function getGpus(): GpuRow[] {
  return store.gpuRows
    .map(id => ({
      id,
      name: (document.getElementById('gn-' + id)?.value || '').trim() || `GPU ${id}`,
      vram: parseFloat(document.getElementById('gv-' + id)?.value || '') || 0,
      price: parseFloat(document.getElementById('gp-' + id)?.value || '') || 0,
      opex: parseFloat(document.getElementById('go-' + id)?.value || '') || 0,
    }))
    .filter(g => g.vram > 0);
}
