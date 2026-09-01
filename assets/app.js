/* Awesome AI Design Resources — list rendering, filtering, theme. No build step. */

const state = { q: '', category: 'all', by: null, view: 'grid', data: null };

const el = {
  list:   document.getElementById('list'),
  chips:  document.getElementById('chips'),
  q:      document.getElementById('q'),
  count:  document.getElementById('count'),
  empty:  document.getElementById('empty'),
  total:  document.getElementById('total'),
  updated:document.getElementById('updated'),
  theme:  document.getElementById('theme'),
  view:   document.getElementById('view'),
  hotkey: document.getElementById('hotkey'),
};

/* ── utils ─────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function highlight(text, q) {
  const safe = esc(text);
  if (!q) return safe;
  const rx = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return safe.replace(rx, '<mark>$1</mark>');
}

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

/* ── url state ─────────────────────────────────────────── */

function readUrl() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') || '';
  state.category = p.get('c') || 'all';
  state.by = p.get('by') || null;
  let view = p.get('v');
  if (view !== 'grid' && view !== 'list') {
    try { view = localStorage.getItem('view'); } catch (e) { view = null; }
  }
  state.view = view === 'list' ? 'list' : 'grid';
  el.q.value = state.q;
}

function writeUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.category !== 'all') p.set('c', state.category);
  if (state.by) p.set('by', state.by);
  if (state.view !== 'grid') p.set('v', state.view);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/* ── filtering ─────────────────────────────────────────── */

function matches(r) {
  if (state.category !== 'all' && r.category !== state.category) return false;
  if (state.by && r.by !== state.by) return false;
  if (!state.q) return true;
  const hay = [r.name, r.domain, r.note, (r.tags || []).join(' ')].join(' ').toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
}

/* ── render ────────────────────────────────────────────── */

function renderChips() {
  const counts = { all: state.data.resources.length };
  for (const r of state.data.resources) counts[r.category] = (counts[r.category] || 0) + 1;

  const cats = [{ id: 'all', label: 'Everything' }, ...state.data.categories]
    .filter((c) => c.id === 'all' || counts[c.id]);
  el.chips.innerHTML = cats.map((c) => `
    <button class="chip" type="button" data-cat="${c.id}"
            aria-pressed="${state.category === c.id}">
      ${esc(c.label)}<span>${counts[c.id] || 0}</span>
    </button>`).join('');
}

function renderByPill() {
  const old = document.getElementById('by-pill');
  if (old) old.remove();
  if (!state.by) return;
  const person = state.data.contributors[state.by];
  const pill = document.createElement('button');
  pill.id = 'by-pill';
  pill.className = 'by-pill';
  pill.type = 'button';
  pill.innerHTML = `via ${esc(person ? person.name : state.by)} <span aria-hidden="true">×</span>`;
  pill.setAttribute('aria-label', `Clear contributor filter`);
  pill.addEventListener('click', () => { state.by = null; render(); });
  el.view.before(pill);
}

function row(r, i) {
  const person = r.by ? state.data.contributors[r.by] : null;
  const credit = person
    ? `<button class="row__by" type="button" data-by="${esc(r.by)}"
               title="Added by ${esc(person.name)}" aria-label="Show only links added by ${esc(person.name)}"><span class="row__by-label">via</span><span class="initial" aria-hidden="true">${esc(person.name.trim().charAt(0).toUpperCase())}</span></button>`
    : '';
  const tags = (r.tags || []).map((t) => `<span>${esc(t)}</span>`).join('');

  return `
  <li class="row">
    <article>
      <span class="row__idx">${String(i + 1).padStart(2, '0')}</span>
      <div class="row__body">
        <h2 class="row__name">
          <a class="stretch" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${highlight(r.name, state.q)}</a>
        </h2>
        <span class="row__domain">${highlight(r.domain, state.q)}</span>
      </div>
      <div class="row__meta">
        <p class="row__note">${highlight(r.note, state.q)}</p>
        <div class="row__tags">${tags}${credit}</div>
      </div>
      <span class="row__go" aria-hidden="true">↗</span>
    </article>
  </li>`;
}

function paintView() {
  el.list.dataset.view = state.view;
  for (const b of el.view.querySelectorAll('.view__btn'))
    b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
}

function render() {
  const hits = state.data.resources.filter(matches);
  el.list.innerHTML = hits.map(row).join('');
  el.empty.hidden = hits.length > 0;
  el.count.textContent = `${hits.length} of ${state.data.resources.length} resources`;
  for (const b of el.chips.querySelectorAll('.chip'))
    b.setAttribute('aria-pressed', String(b.dataset.cat === state.category));
  renderByPill();
  paintView();
  writeUrl();
}

/* ── events ────────────────────────────────────────────── */

el.chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.category = b.dataset.cat;
  render();
});

el.list.addEventListener('click', (e) => {
  const b = e.target.closest('.row__by');
  if (!b) return;
  e.preventDefault();
  state.by = b.dataset.by;
  render();
});

el.view.addEventListener('click', (e) => {
  const b = e.target.closest('.view__btn');
  if (!b || b.dataset.view === state.view) return;
  state.view = b.dataset.view;
  try { localStorage.setItem('view', state.view); } catch (err) {}
  paintView();
  writeUrl();
});

let searchTimer;
el.q.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = el.q.value.trim(); render(); }, 90);
});

/* Cmd+K on Apple platforms, Ctrl+K everywhere else. `/` stays as a shortcut too. */
const IS_APPLE = /mac|iphone|ipad|ipod/i.test(
  (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent
);

function focusSearch(e) {
  e.preventDefault();
  el.q.focus();
  el.q.select();
}

document.addEventListener('keydown', (e) => {
  const mod = IS_APPLE ? e.metaKey : e.ctrlKey;
  if (mod && !e.altKey && e.key.toLowerCase() === 'k') return focusSearch(e);
  if (e.key === '/' && document.activeElement !== el.q) return focusSearch(e);
  if (e.key === 'Escape' && document.activeElement === el.q) { el.q.value = ''; state.q = ''; render(); el.q.blur(); }
});

function paintTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  el.theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

el.theme.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  paintTheme();
});

/* ── boot ──────────────────────────────────────────────── */

(async function init() {
  paintTheme();
  el.hotkey.textContent = IS_APPLE ? '\u2318K' : 'Ctrl K';
  el.q.setAttribute('aria-keyshortcuts', IS_APPLE ? 'Meta+K' : 'Control+K');
  try {
    state.data = await (await fetch('data/resources.json', { cache: 'no-cache' })).json();
  } catch (err) {
    el.empty.hidden = false;
    el.empty.textContent = 'Could not load the index — serve this over http, not file://.';
    return;
  }
  state.data.resources.sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  el.total.textContent = state.data.resources.length;
  el.updated.textContent = fmtDate(state.data.resources[0].added);
  readUrl();
  renderChips();
  render();
})();
