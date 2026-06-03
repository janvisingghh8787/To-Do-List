/**
 * ui.js
 * ─────
 * Pure DOM-rendering helpers.
 * No fetch calls here — only takes data and builds HTML.
 */

const UI = (() => {

  // ── Toast ─────────────────────────────────────────────────────────────────
  let toastTimer = null;

  function toast(message, type = 'ok') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
  }

  // ── Progress ring ─────────────────────────────────────────────────────────
  function updateRing(pct) {
    const circumference = 201; // 2π × r32
    const offset = circumference - (pct / 100) * circumference;
    const fill = document.getElementById('ring-fill');
    const label = document.getElementById('ring-pct');
    if (fill)  fill.style.strokeDashoffset = offset;
    if (label) label.textContent = `${pct}%`;
  }

  // ── Sidebar badges ────────────────────────────────────────────────────────
  function updateBadges(todos) {
    const now = new Date();

    const todayStr = now.toISOString().slice(0, 10);

    const all       = todos.length;
    const pending   = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t =>  t.completed).length;
    const overdue   = todos.filter(t => t.is_overdue).length;
    const today     = todos.filter(t => {
      if (!t.due_date) return false;
      return t.due_date.slice(0, 10) === todayStr && !t.completed;
    }).length;

    setText('badge-all',       all);
    setText('badge-pending',   pending);
    setText('badge-completed', completed);
    setText('badge-overdue',   overdue);
    setText('badge-today',     today);
    setText('stat-total',      all);
    setText('stat-done',       completed);
    setText('stat-overdue',    overdue);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Category sidebar list ─────────────────────────────────────────────────
  function renderCategories(categories, activeCatId, onSelect, onDelete) {
    const list = document.getElementById('category-list');
    if (!list) return;

    list.innerHTML = categories.map(cat => `
      <div class="cat-row ${cat.id === activeCatId ? 'active' : ''}"
           data-cat-id="${cat.id}" role="button" tabindex="0">
        <span class="cat-dot" style="background:${cat.color}"></span>
        <span class="cat-name-txt">${escHtml(cat.icon)} ${escHtml(cat.name)}</span>
        <button class="cat-del" data-del-cat="${cat.id}" aria-label="Delete category" title="Delete">✕</button>
      </div>
    `).join('');

    // Attach events
    list.querySelectorAll('.cat-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.cat-del')) return; // handled below
        onSelect(row.dataset.catId);
      });
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter') onSelect(row.dataset.catId);
      });
    });

    list.querySelectorAll('.cat-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        onDelete(btn.dataset.delCat);
      });
    });
  }

  // ── Populate category <select> in modal ───────────────────────────────────
  function populateCategorySelect(categories, selectedId = '') {
    const sel = document.getElementById('f-category');
    if (!sel) return;
    sel.innerHTML = `<option value="">— None —</option>` +
      categories.map(c =>
        `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>
          ${escHtml(c.icon)} ${escHtml(c.name)}
        </option>`
      ).join('');
  }

  // ── Task list ─────────────────────────────────────────────────────────────
  function renderTodos(todos, onToggle, onEdit, onDelete) {
    const list   = document.getElementById('task-list');
    const empty  = document.getElementById('empty-state');
    if (!list) return;

    // Remove old cards (keep empty-state node)
    list.querySelectorAll('.card').forEach(c => c.remove());

    if (todos.length === 0) {
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    todos.forEach(todo => {
      const card = buildCard(todo, onToggle, onEdit, onDelete);
      list.appendChild(card);
    });
  }

  function buildCard(todo, onToggle, onEdit, onDelete) {
    const card = document.createElement('div');
    card.className = `card ${todo.completed ? 'is-done' : ''} ${todo.is_overdue ? 'is-overdue' : ''}`;
    card.dataset.priority = todo.priority;
    card.dataset.id = todo.id;

    // Due date label
    let dueHtml = '';
    if (todo.due_date) {
      const d = new Date(todo.due_date);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      dueHtml = `<span class="due-lbl ${todo.is_overdue ? 'overdue' : ''}">📅 ${label}</span>`;
    }

    // Category badge
    let catHtml = '';
    if (todo.category) {
      catHtml = `<span class="cat-badge" style="background:${todo.category.color}22;color:${todo.category.color}">
        ${escHtml(todo.category.icon)} ${escHtml(todo.category.name)}
      </span>`;
    }

    // Tags
    const tagsHtml = (todo.tags || [])
      .slice(0, 3)
      .map(t => `<span class="tag-pill">#${escHtml(t)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="cb-wrap">
        <button class="cb ${todo.completed ? 'checked' : ''}" aria-label="Toggle complete" title="Mark done">
          ${todo.completed ? '✓' : ''}
        </button>
      </div>
      <div class="card-body">
        <p class="card-title">${escHtml(todo.title)}</p>
        ${todo.description ? `<p class="card-desc">${escHtml(todo.description)}</p>` : ''}
        <div class="card-meta">
          <span class="badge badge-${todo.priority}">${todo.priority}</span>
          ${dueHtml}
          ${catHtml}
          ${tagsHtml}
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn edit" aria-label="Edit" title="Edit">✎</button>
        <button class="card-btn del"  aria-label="Delete" title="Delete">🗑</button>
      </div>
    `;

    card.querySelector('.cb').addEventListener('click', e => {
      e.stopPropagation();
      onToggle(todo.id);
    });
    card.querySelector('.edit').addEventListener('click', e => {
      e.stopPropagation();
      onEdit(todo);
    });
    card.querySelector('.del').addEventListener('click', e => {
      e.stopPropagation();
      onDelete(todo.id);
    });
    card.addEventListener('click', () => onEdit(todo));

    return card;
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function setModalMode(isEdit) {
    const title  = document.getElementById('modal-title');
    const submit = document.getElementById('modal-submit');
    if (title)  title.textContent  = isEdit ? 'Edit Task'    : 'New Task';
    if (submit) submit.textContent = isEdit ? 'Save Changes' : 'Create Task';
  }

  function fillTodoForm(todo) {
    setValue('f-title',    todo.title        || '');
    setValue('f-desc',     todo.description  || '');
    setValue('f-priority', todo.priority     || 'medium');
    setValue('f-due',      todo.due_date ? todo.due_date.slice(0, 10) : '');
    setValue('f-tags',     (todo.tags || []).join(', '));
    setValue('f-category', todo.category ? todo.category.id : '');
  }

  function clearTodoForm() {
    ['f-title','f-desc','f-due','f-tags'].forEach(id => setValue(id, ''));
    setValue('f-priority', 'medium');
    setValue('f-category', '');
  }

  function getTodoFormData() {
    return {
      title:       getVal('f-title').trim(),
      description: getVal('f-desc').trim(),
      priority:    getVal('f-priority'),
      due_date:    getVal('f-due') ? new Date(getVal('f-due')).toISOString() : null,
      category_id: getVal('f-category') || null,
      tags:        getVal('f-tags').split(',').map(t => t.trim()).filter(Boolean),
    };
  }

  function getCatFormData() {
    return {
      name:  getVal('c-name').trim(),
      color: getVal('c-color'),
      icon:  getVal('c-icon').trim() || '📁',
    };
  }

  function clearCatForm() {
    setValue('c-name', '');
    setValue('c-color', '#7c6ef5');
    setValue('c-icon', '📁');
  }

  // ── Page heading ──────────────────────────────────────────────────────────
  function setPageTitle(title) {
    const el = document.getElementById('page-title');
    if (el) el.textContent = title;
  }

  function setPageDate() {
    const el = document.getElementById('page-date');
    if (el) {
      el.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  // ── Public ────────────────────────────────────────────────────────────────
  return {
    toast,
    updateRing,
    updateBadges,
    renderCategories,
    populateCategorySelect,
    renderTodos,
    openModal,
    closeModal,
    setModalMode,
    fillTodoForm,
    clearTodoForm,
    getTodoFormData,
    getCatFormData,
    clearCatForm,
    setPageTitle,
    setPageDate,
  };
})();
