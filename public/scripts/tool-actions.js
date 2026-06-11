const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      /* fall through */
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Copy command failed");
};

const setTemporaryText = (button, text, fallback) => {
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = fallback;
  }, 2200);
};

const addLocalSlug = (key, slug, max, append = true) => {
  let slugs = [];
  try {
    slugs = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {}
  if (!slug) return slugs.slice(0, max);
  if (!slugs.includes(slug)) {
    slugs = append ? [...slugs, slug] : [slug, ...slugs];
  }
  slugs = slugs.slice(0, max);
  localStorage.setItem(key, JSON.stringify(slugs));
  return slugs;
};

const handleToolAction = async (event) => {
  const button = event.target.closest("[data-tool-action]");
  if (!button) return;

  const action = button.dataset.toolAction;
  const slug = button.dataset.slug;

  if (action === "share") {
    try {
      await copyText(window.location.href);
      setTemporaryText(button, "Copied", "Share");
    } catch {
      setTemporaryText(button, "Copy failed", "Share");
    }
  }

  if (action === "compare") {
    const slugs = addLocalSlug("enclavetools-compare", slug, 4);
    localStorage.setItem("enclavetools-compare", JSON.stringify(slugs));
    window.dispatchEvent(
      new CustomEvent("compare:changed", { detail: { slugs } }),
    );
    setTemporaryText(button, "Added", "Add to compare");
  }

  if (action === "stack") {
    openStackPicker(slug, button);
  }
};

/* ── Stack Picker ───────────────────────────────────────────── */
const STORAGE_KEY = "enclavetools-stacks";
const ACTIVE_KEY  = "enclavetools-active-stack";
const LEGACY_KEY  = "enclavetools-stack";
const MAX_TOOLS   = 8;

const readStacks  = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };
const writeStacks = (s) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); window.dispatchEvent(new CustomEvent('stacks:changed', { detail: { stacks: s } })); };

const migrateLegacy = () => {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const tools = JSON.parse(legacy);
    localStorage.removeItem(LEGACY_KEY);
    if (!Array.isArray(tools) || !tools.length) return;
    if (readStacks().length) return;
    const ts = new Date().toISOString();
    writeStacks([{ id: "default", name: "My Stack", tools: tools.slice(0, MAX_TOOLS), created: ts, updated: ts }]);
    localStorage.setItem(ACTIVE_KEY, "default");
  } catch { /* silent */ }
};

const genId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureStacks = () => {
  migrateLegacy();
  let stacks = readStacks();
  if (!stacks.length) {
    const ts = new Date().toISOString();
    const stack = { id: genId(), name: "My Stack", tools: [], created: ts, updated: ts };
    stacks = [stack];
    writeStacks(stacks);
    localStorage.setItem(ACTIVE_KEY, stack.id);
  }
  return stacks;
};

const addToolToStack = (stackId, toolSlug) => {
  const stacks = readStacks();
  const stack  = stacks.find((s) => s.id === stackId);
  if (!stack || stack.tools.includes(toolSlug) || stack.tools.length >= MAX_TOOLS) return false;
  stack.tools = [toolSlug, ...stack.tools].slice(0, MAX_TOOLS);
  stack.updated = new Date().toISOString();
  writeStacks(stacks);
  localStorage.setItem(ACTIVE_KEY, stackId);
  return true;
};

const createAndAddStack = (toolSlug) => {
  const stacks = readStacks();
  const ts = new Date().toISOString();
  const stack = { id: genId(), name: "My Stack", tools: [toolSlug], created: ts, updated: ts };
  stacks.push(stack);
  writeStacks(stacks);
  localStorage.setItem(ACTIVE_KEY, stack.id);
  return stack;
};

let _pickerSlug = null;

const closeDropdown = () => {
  const dd  = document.getElementById("stack-picker-dropdown");
  const btn = document.getElementById("add-to-stack-btn");
  if (dd)  dd.classList.add("hidden");
  if (btn) btn.setAttribute("aria-expanded", "false");
  // Always reset the create form to its default state on close
  const newBtn = document.getElementById("stack-picker-new");
  const form   = document.getElementById("stack-picker-create-form");
  if (newBtn) newBtn.classList.remove("hidden");
  if (form)   form.classList.add("hidden");
};

const renderStackList = (toolSlug) => {
  const list = document.getElementById("stack-picker-list");
  if (!list) return;
  const stacks   = ensureStacks();
  const activeId = localStorage.getItem(ACTIVE_KEY);
  list.innerHTML = "";
  stacks.forEach((stack) => {
    const alreadyIn = stack.tools.includes(toolSlug);
    const full      = stack.tools.length >= MAX_TOOLS && !alreadyIn;
    const isActive  = stack.id === activeId;
    const item = document.createElement("button");
    item.type = "button";
    item.disabled = alreadyIn || full;
    item.className = [
      "w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider transition-colors border-none outline-none",
      alreadyIn || full
        ? "text-gray-400 cursor-not-allowed bg-gray-50"
        : "text-gray-900 hover:bg-primary-500 hover:text-white cursor-pointer bg-white",
    ].join(" ");
    const dot = isActive
      ? `<span class="inline-block w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>`
      : `<span class="inline-block w-2 h-2 rounded-full border-2 border-gray-300 flex-shrink-0"></span>`;
    const badge = alreadyIn ? "already added" : full ? "full" : `${stack.tools.length}/${MAX_TOOLS}`;
    item.innerHTML = `<span class="flex items-center gap-2 truncate">${dot}<span class="truncate">${stack.name}</span></span><span class="text-gray-400 font-normal normal-case flex-shrink-0">${badge}</span>`;
    if (!alreadyIn && !full) {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        addToolToStack(stack.id, toolSlug);
        closeDropdown();
        window.location.assign(`/stack-builder?stack=${stack.id}`);
      });
    }
    list.appendChild(item);
  });
};

const openStackPicker = (toolSlug, triggerBtn) => {
  _pickerSlug = toolSlug;
  const dd = document.getElementById("stack-picker-dropdown");
  if (!dd) return;
  const isOpen = !dd.classList.contains("hidden");
  if (isOpen) { closeDropdown(); return; }
  renderStackList(toolSlug);
  dd.classList.remove("hidden");
  triggerBtn.setAttribute("aria-expanded", "true");
};

const showCreateForm = (e) => {
  e && e.stopPropagation();
  const newBtn  = document.getElementById("stack-picker-new");
  const form    = document.getElementById("stack-picker-create-form");
  const input   = document.getElementById("stack-picker-name-input");
  if (!newBtn || !form) return;
  newBtn.classList.add("hidden");
  form.classList.remove("hidden");
  if (input) { input.value = ""; setTimeout(() => input.focus(), 0); }
};

const hideCreateForm = (e) => {
  e && e.stopPropagation();
  const newBtn = document.getElementById("stack-picker-new");
  const form   = document.getElementById("stack-picker-create-form");
  if (!newBtn || !form) return;
  form.classList.add("hidden");
  newBtn.classList.remove("hidden");
};

const commitCreateStack = (e) => {
  e && e.stopPropagation();
  const input = document.getElementById("stack-picker-name-input");
  const rawName = input ? input.value.trim() : "";
  const name = rawName.slice(0, 30) || "My Stack";
  const stack  = createAndAddStack(_pickerSlug);
  const stacks = readStacks();
  const s = stacks.find((x) => x.id === stack.id);
  if (s) { s.name = name; writeStacks(stacks); }
  hideCreateForm();
  closeDropdown();
  window.location.assign(`/stack-builder?stack=${stack.id}`);
};

const handleCreateFormKeyDown = (e) => {
  if (e.key === "Enter")  { e.preventDefault(); commitCreateStack(); }
  if (e.key === "Escape") { e.stopPropagation(); hideCreateForm(); }
};

const handleOutsideClick = (e) => {
  const anchor = document.getElementById("stack-picker-anchor");
  if (anchor && !anchor.contains(e.target)) closeDropdown();
};

const handleKeyDown = (e) => {
  if (e.key === "Escape") closeDropdown();
};

const bindToolActions = () => {
  document.removeEventListener("click", handleToolAction);
  document.addEventListener("click", handleToolAction);
  document.removeEventListener("click", handleOutsideClick);
  document.addEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleKeyDown);
  document.addEventListener("keydown", handleKeyDown);

  const newBtn  = document.getElementById("stack-picker-new");
  const confirm = document.getElementById("stack-picker-confirm");
  const cancel  = document.getElementById("stack-picker-cancel");
  const input   = document.getElementById("stack-picker-name-input");
  if (newBtn)  { newBtn.removeEventListener("click",    showCreateForm);         newBtn.addEventListener("click",    showCreateForm); }
  if (confirm) { confirm.removeEventListener("click",   commitCreateStack);      confirm.addEventListener("click",   commitCreateStack); }
  if (cancel)  { cancel.removeEventListener("click",    hideCreateForm);         cancel.addEventListener("click",    hideCreateForm); }
  if (input)   { input.removeEventListener("keydown",   handleCreateFormKeyDown); input.addEventListener("keydown",   handleCreateFormKeyDown); }
};

bindToolActions();
document.addEventListener("astro:page-load", bindToolActions);
