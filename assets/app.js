/* Awesome AI Design Resources — list rendering, filtering, theme. No build step. */

const state = { q: '', category: 'all', by: '', view: 'grid', data: null };

const el = {
  list:   document.getElementById('list'),
  chips:  document.getElementById('chips'),
  q:      document.getElementById('q'),
  count:  document.getElementById('count'),
  empty:  document.getElementById('empty'),
  theme:  document.getElementById('theme'),
  view:   document.getElementById('view'),
  hotkey: document.getElementById('hotkey'),
  clear:  document.getElementById('clear'),
  people: document.getElementById('people'),
  peopleList: document.getElementById('people-list'),
  az:     document.getElementById('az'),
  azBubble: document.getElementById('az-bubble'),
  controls: document.getElementById('controls'),
};

/* ── utils ─────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* A–Z bucket for a name: accents folded, anything that isn't a letter goes under # */
const letterOf = (name) => {
  const c = name.normalize('NFD').charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
};
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

function highlight(text, q) {
  const safe = esc(text);
  if (!q) return safe;
  const rx = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return safe.replace(rx, '<mark>$1</mark>');
}

/* ── url state ─────────────────────────────────────────── */

function readUrl() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') || '';
  state.category = p.get('c') || 'all';
  state.by = p.get('by') || '';
  if (!state.data.contributors?.[state.by]) state.by = '';
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

  const cats = [{ id: 'all', label: 'All' }, ...state.data.categories]
    .filter((c) => c.id === 'all' || counts[c.id]);
  const who = state.by && state.data.contributors[state.by];
  const byChip = who ? `
    <button class="chip chip--by" type="button" data-clear-by
            aria-label="Remove filter: links by ${esc(who.name)}">
      By ${esc(who.name)}<span aria-hidden="true">×</span>
    </button>` : '';
  el.chips.innerHTML = byChip + cats.map((c) => `
    <button class="chip" type="button" data-cat="${c.id}"
            aria-pressed="${state.category === c.id}">
      ${esc(c.label)}<span>${counts[c.id] || 0}</span>
    </button>`).join('');
  paintChipEdges();
}

/* On phones the chip row scrolls sideways; mark which edges have more to
   reveal so CSS can fade them. On desktop the row wraps and nothing is set. */
function paintChipEdges() {
  const c = el.chips;
  const more = [];
  if (c.scrollLeft > 2) more.push('left');
  if (c.scrollLeft + c.clientWidth < c.scrollWidth - 2) more.push('right');
  c.dataset.more = more.join(' ');
}

/* keep the selected chip in view when it's off-screen in the scrolling row */
function revealChip(b) {
  if (!b || el.chips.scrollWidth <= el.chips.clientWidth) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}

function row(r, i, hits) {
  const letter = letterOf(r.name);
  const first = i === 0 || letterOf(hits[i - 1].name) !== letter;
  const tags = (r.tags || []).map((t) => `<span>${esc(t)}</span>`).join('');

  return `
  <li class="row"${first ? ` data-letter="${letter}"` : ''}>
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
        <div class="row__tags">${tags}</div>
      </div>
      <span class="row__go" aria-hidden="true">↗</span>
    </article>
  </li>`;
}

function renderPeople() {
  const counts = {};
  for (const r of state.data.resources) if (r.by) counts[r.by] = (counts[r.by] || 0) + 1;

  const people = Object.entries(state.data.contributors || {})
    .filter(([id]) => counts[id])
    .sort((a, b) => counts[b[0]] - counts[a[0]]);
  el.peopleList.innerHTML = people.map(([id, p]) => `
    <li>
      <button class="people__name" type="button" data-by="${esc(id)}"
              aria-current="${state.by === id}">
        ${esc(p.name)}<span>${counts[id]}</span>
      </button>
      ${p.url ? `<a class="people__site" href="${esc(p.url)}" target="_blank" rel="noopener"
         aria-label="${esc(p.name)}’s site" title="${esc(p.name)}’s site">↗</a>` : ''}
    </li>`).join('');
}

function renderAz(hits) {
  const have = new Set(hits.map((r) => letterOf(r.name)));
  el.az.innerHTML = hits.length ? LETTERS.map((l) => `
    <button type="button" data-letter="${l}" aria-label="Jump to ${l === '#' ? 'numbers' : l}"
            ${have.has(l) ? '' : 'aria-disabled="true"'}>${l}</button>`).join('') : '';
}

function paintView() {
  el.list.dataset.view = state.view;
  el.view.dataset.active = state.view;
  for (const b of el.view.querySelectorAll('.view__btn'))
    b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
}

function render() {
  renderPeople();
  const hits = state.data.resources.filter(matches);
  el.list.innerHTML = hits.map(row).join('');
  renderAz(hits);
  el.empty.hidden = hits.length > 0;
  el.count.textContent = `${hits.length} of ${state.data.resources.length} resources`;
  for (const b of el.chips.querySelectorAll('.chip[data-cat]'))
    b.setAttribute('aria-pressed', String(b.dataset.cat === state.category));
  paintView();
  writeUrl();
}

/* ── events ────────────────────────────────────────────── */

el.chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  if (b.hasAttribute('data-clear-by')) {
    state.by = '';
    renderChips();
    el.chips.querySelector('.chip[aria-pressed="true"]')?.focus();
  } else {
    state.category = b.dataset.cat;
    revealChip(b);
  }
  render();
});

el.chips.addEventListener('scroll', paintChipEdges, { passive: true });
window.addEventListener('resize', paintChipEdges);

el.view.addEventListener('click', (e) => {
  const b = e.target.closest('.view__btn');
  if (!b || b.dataset.view === state.view) return;
  state.view = b.dataset.view;
  try { localStorage.setItem('view', state.view); } catch (err) {}
  paintView();
  writeUrl();
});

el.peopleList.addEventListener('click', (e) => {
  const b = e.target.closest('.people__name');
  if (!b) return;
  state.by = state.by === b.dataset.by ? '' : b.dataset.by;
  state.category = 'all';
  el.people.open = false;
  renderChips();
  render();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

/* close the contributors panel on outside click or Escape */
document.addEventListener('click', (e) => {
  if (el.people.open && !el.people.contains(e.target)) el.people.open = false;
});

/* A–Z rail: tap a letter, or press and slide along the rail like iOS Contacts.
   A letter with no rows jumps to the next one that has some. */
/* The rail is a phone affordance only. JS owns its visibility too, so a stale
   or missing stylesheet can never leave it sitting under the list on desktop. */
const PHONE = matchMedia('(max-width: 620px)');
const paintAzVisibility = () => { el.az.hidden = !PHONE.matches; };
PHONE.addEventListener('change', paintAzVisibility);
paintAzVisibility();

let azCurrent = '';
let azHideTimer;

function jumpTo(letter) {
  if (!letter || letter === azCurrent) return;
  azCurrent = letter;
  el.azBubble.textContent = letter;
  el.azBubble.setAttribute('data-on', '');

  const from = LETTERS.indexOf(letter);
  let target = null;
  for (const l of LETTERS.slice(from)) {
    target = el.list.querySelector(`[data-letter="${l}"]`);
    if (target) break;
  }
  target ||= [...el.list.querySelectorAll('[data-letter]')].pop();
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.scrollY - el.controls.offsetHeight - 8;
  window.scrollTo({ top: y, behavior: 'auto' });
}

function letterAt(e) {
  const b = document.elementFromPoint(el.az.getBoundingClientRect().left + 8, e.clientY);
  return b && b.parentElement === el.az ? b.dataset.letter : '';
}

function endScrub() {
  azCurrent = '';
  clearTimeout(azHideTimer);
  azHideTimer = setTimeout(() => el.azBubble.removeAttribute('data-on'), 350);
}

el.az.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  el.az.setPointerCapture(e.pointerId);
  clearTimeout(azHideTimer);
  jumpTo(letterAt(e));
});
el.az.addEventListener('pointermove', (e) => {
  if (el.az.hasPointerCapture(e.pointerId)) jumpTo(letterAt(e));
});
el.az.addEventListener('pointerup', endScrub);
el.az.addEventListener('pointercancel', endScrub);
/* keyboard and screen-reader activation (pointer taps are handled above) */
el.az.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || e.detail) return;
  jumpTo(b.dataset.letter);
  endScrub();
});

el.clear.addEventListener('click', () => {
  el.q.value = '';
  state.q = '';
  render();
  el.q.focus();
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
  if (e.key === 'Escape' && el.people.open) { el.people.open = false; el.people.querySelector('summary').focus(); return; }
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
  el.hotkey.innerHTML = IS_APPLE
    ? '<span>\u2318</span><span>K</span>'
    : '<span>Ctrl</span><span>K</span>';
  el.q.setAttribute('aria-keyshortcuts', IS_APPLE ? 'Meta+K' : 'Control+K');
  try {
    state.data = await (await fetch('data/resources.json', { cache: 'no-cache' })).json();
  } catch (err) {
    el.empty.hidden = false;
    el.empty.innerHTML = location.protocol === 'file:'
      ? `<span>Could not load the index — serve this over http, not file://.</span>
         <span>In this folder, run <code>python3 -m http.server 4000</code>
         then open <a href="http://localhost:4000/">localhost:4000</a></span>`
      : 'Could not load the index. Check that data/resources.json is valid JSON.';
    return;
  }
  /* A–Z, with names that start with a digit or symbol last, under # (as in iOS Contacts) */
  state.data.resources.sort((a, b) =>
    (letterOf(a.name) === '#') - (letterOf(b.name) === '#') ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  readUrl();
  renderChips();
  render();
  /* a shared ?c= link may select a chip that starts off-screen on a phone */
  el.chips.querySelector('.chip[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  paintChipEdges();
})();
