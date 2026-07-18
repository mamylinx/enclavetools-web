import { store } from './store';
import { MODEL_ARCH } from './data';
import { checkFtSupport } from './step4';

/** Step 1: model selected — load its architecture into state and show the note. */
export function onModelChange(): void {
  const sel = document.getElementById('modelSelect') as HTMLSelectElement;
  const v = sel.value;
  const s = store.state;
  if (!v) {
    s.params = 0;
    (document.getElementById('s1next') as HTMLButtonElement).disabled = true;
    return;
  }
  const m = MODEL_ARCH[v];
  if (!m) return;
  s.params = m.params;
  s.layers = m.layers;
  s.attnHeads = m.attnH;
  s.kvHeads = m.kvH;
  s.dHead = m.dHead;
  s.modelLabel = m.label;

  (document.getElementById('ovrLayers') as HTMLInputElement).value = String(m.layers);
  (document.getElementById('ovrAttnH') as HTMLInputElement).value = String(m.attnH);
  (document.getElementById('ovrKvH') as HTMLInputElement).value = String(m.kvH);
  (document.getElementById('ovrDHead') as HTMLInputElement).value = String(m.dHead);

  document.getElementById('modelNote')!.classList.remove('hidden');
  document.getElementById('modelNoteText')!.innerHTML =
    `Layers: <strong class="text-brand-forest">${m.layers}</strong> &nbsp;|&nbsp; Attention heads: <strong class="text-brand-forest">${m.attnH}</strong> &nbsp;|&nbsp; KV heads: <strong class="text-brand-forest">${m.kvH}</strong> &nbsp;|&nbsp; Head dimension: <strong class="text-brand-forest">${m.dHead}</strong><br/><span class="note">${m.note}</span>`;
  (document.getElementById('s1next') as HTMLButtonElement).disabled = false;

  checkFtSupport();
}

/** Step 1: precision chosen — update state and highlight the selection. */
export function selPrec(label: string, z: number, btn: HTMLElement): void {
  const s = store.state;
  s.precision = z;
  s.precLabel = label;
  document.querySelectorAll('#step1 .choice-btn[data-action="selPrec"]').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}
