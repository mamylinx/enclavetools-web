import { store } from './store';
import { renderSummaryBar } from './nav';

/** Step 2: range slider → number field sync (target is the number input id). */
export function syncToken(id: string, val: string): void {
  const v = parseInt(val) || 0;
  (document.getElementById(id) as HTMLInputElement).value = String(v);
  const s = store.state;
  if (id === 'inTok') {
    s.inTok = v;
    document.getElementById('inTokV')!.textContent = v.toLocaleString();
    (document.getElementById('inTokR') as HTMLInputElement).value = String(Math.min(v, 100000));
  }
  if (id === 'outTok') {
    s.outTok = v;
    document.getElementById('outTokV')!.textContent = v.toLocaleString();
    (document.getElementById('outTokR') as HTMLInputElement).value = String(Math.min(v, 8000));
  }
  document.getElementById('ctxWindowLive')!.textContent = (s.inTok + s.outTok).toLocaleString();
  renderSummaryBar();
}

/** Step 2: number field → range slider sync (ridId is the range id). */
export function syncSlider(ridId: string, val: string, vidId: string): void {
  const v = parseInt(val) || 0;
  (document.getElementById(ridId) as HTMLInputElement).value = String(v);
  document.getElementById(vidId)!.textContent = v.toLocaleString();
  const s = store.state;
  if (ridId === 'inTokR') s.inTok = v;
  if (ridId === 'outTokR') s.outTok = v;
  if (ridId === 'usersR') s.users = v;
  document.getElementById('ctxWindowLive')!.textContent = (s.inTok + s.outTok).toLocaleString();
  renderSummaryBar();
}

/** Step 2: quick preset — set both token fields and highlight the preset. */
export function setTokens(inp: number, out: number, btn: HTMLElement): void {
  const s = store.state;
  s.inTok = inp;
  s.outTok = out;
  (document.getElementById('inTok') as HTMLInputElement).value = String(inp);
  document.getElementById('inTokV')!.textContent = inp.toLocaleString();
  (document.getElementById('inTokR') as HTMLInputElement).value = String(Math.min(inp, 100000));
  (document.getElementById('outTok') as HTMLInputElement).value = String(out);
  document.getElementById('outTokV')!.textContent = out.toLocaleString();
  (document.getElementById('outTokR') as HTMLInputElement).value = String(Math.min(out, 8000));
  document.getElementById('ctxWindowLive')!.textContent = (inp + out).toLocaleString();
  document.querySelectorAll('#step2 [data-action="setTokens"]').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  renderSummaryBar();
}
