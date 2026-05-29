/**
 * ui.js — Opus Todo · UI / Rendering Layer
 * Pure rendering functions that read from API and paint the DOM.
 */

const UI = (() => {

  /* ── Formatters ───────────────────────────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (+d === +today)    return 'Today';
    if (+d === +tomorrow) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }

  function todayLabel() {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  /* ── Task Card ────────────────────────────────────────────────────────── */
  function buildTaskCard(todo, categories) {
    const cat     = categories.find(c => c.id === todo.categoryId);
    const overdue = API.isOverdue(todo);

    const card = document.createElement('div');
    card.className = `task-card${todo.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`;
    card.dataset.id       = todo.id;
    card.dataset.priority = todo.priority;

    // ── Checkbox ──────────────────────────────────────────────────────
    const checkWrap = document.createElement('div');
    checkWrap.className = 'task-check-wrap';
    const checkbox = document.createElement('button');
    checkbox.className = `task-checkbox${todo.completed ? ' checked' : ''}`;
    checkbox.setAttribute('aria-label', todo.completed ? 'Mark incomplete' : 'Mark complete');
    checkbox.dataset.action = 'toggle';
    checkbox.dataset.id     = todo.id;
    if (todo.completed) checkbox.textContent = '✓';
    checkWrap.appendChild(checkbox);

    // ── Body ──────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'task-body';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = todo.title;

    body.appendChild(title);

    if (todo.description) {
      const desc = document.createElement('div');
      desc.className  = 'task-desc';
      desc.textContent = todo.description;
      body.appendChild(desc);
    }

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const prio = document.createElement('span');
    prio.className = `task-priority ${todo.priority}`;
    prio.textContent = todo.priority;
    meta.appendChild(prio);

    if (todo.dueDate) {
      const due = document.createElement('span');
      due.className = `task-due${overdue ? ' overdue-text' : ''}`;
      due.innerHTML  = `<span>${overdue ? '⚠' : '◷'}</span> ${formatDate(todo.dueDate)}`;
      meta.appendChild(due);
    }

    if (cat) {
      const catBadge = document.createElement('span');
      catBadge.className = 'task-category';
      catBadge.style.background = cat.color + '22';
      catBadge.style.color      = cat.color;
      catBadge.textContent = `${cat.icon} ${cat.name}`;
      meta.appendChild(catBadge);
    }

    todo.tags.forEach(tag => {
      if (!tag.trim()) return;
      const tagEl = document.createElement('span');
      tagEl.className   = 'task-tag';
      tagEl.textContent = `#${tag.trim()}`;
      meta.appendChild(tagEl);
    });

    body.appendChild(meta);

    // ── Actions ───────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className      = 'task-action-btn';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id     = todo.id;
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent    = '✎';

    const delBtn = document.createElement('button');
    delBtn.className      = 'task-action-btn delete';
    delBtn.dataset.action = 'delete';
    delBtn.dataset.id     = todo.id;
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.textContent    = '✕';

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(checkWrap);
    card.appendChild(body);
    card.appendChild(actions);
    return card;
  }

  /* ── Task List ────────────────────────────────────────────────────────── */
  function renderTasks(todos, categories) {
    const list  = document.getElementById('task-list');
    const empty = document.getElementById('empty-state');

    // Remove old cards (keep empty-state node)
    [...list.querySelectorAll('.task-card')].forEach(el => el.remove());

    if (todos.length === 0) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    const frag = document.createDocumentFragment();
    todos.forEach(todo => frag.appendChild(buildTaskCard(todo, categories)));
    list.appendChild(frag);
  }

  /* ── Sidebar Badges ───────────────────────────────────────────────────── */
  function renderBadges() {
    const counts = API.getCounts();
    document.getElementById('badge-all').textContent       = counts.all;
    document.getElementById('badge-today').textContent     = counts.today;
    document.getElementById('badge-pending').textContent   = counts.pending;
    document.getElementById('badge-completed').textContent = counts.completed;
    document.getElementById('badge-overdue').textContent   = counts.overdue;
  }

  /* ── Category List (sidebar) ──────────────────────────────────────────── */
  function renderCategories(activeCategoryId = '') {
    const cats      = API.getCategories();
    const todos     = API.getTodos();
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    cats.forEach(cat => {
      const count = todos.filter(t => t.categoryId === cat.id).length;
      const item  = document.createElement('div');
      item.className       = `cat-item${activeCategoryId === cat.id ? ' active' : ''}`;
      item.dataset.catId   = cat.id;
      item.innerHTML = `
        <span class="cat-dot" style="background:${cat.color}"></span>
        <span class="cat-name">${cat.icon} ${cat.name}</span>
        <span class="nav-badge" style="font-size:11px">${count}</span>
        <button class="cat-del" data-cat-del="${cat.id}" aria-label="Delete category">✕</button>
      `;
      container.appendChild(item);
    });

    // Populate category select in modal
    const sel = document.getElementById('todo-category');
    // Keep first "None" option
    while (sel.options.length > 1) sel.remove(1);
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value       = c.id;
      opt.textContent = `${c.icon} ${c.name}`;
      sel.appendChild(opt);
    });
  }

  /* ── Progress Ring + Stats ────────────────────────────────────────────── */
  function renderStats() {
    const todos = API.getTodos();
    const total = todos.length;
    const done  = todos.filter(t => t.completed).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-done').textContent  = done;
    document.getElementById('ring-pct').textContent   = pct + '%';

    const circumference = 213.6;
    const offset        = circumference - (pct / 100) * circumference;
    document.getElementById('ring-fill').style.strokeDashoffset = offset;
  }

  /* ── Header ───────────────────────────────────────────────────────────── */
  function renderHeader(filter) {
    const titles = {
      all: 'All Tasks', today: 'Today', pending: 'Pending',
      completed: 'Completed', overdue: 'Overdue',
    };
    document.getElementById('header-title').textContent = titles[filter] || 'Tasks';
    document.getElementById('header-date').textContent  = todayLabel();
  }

  /* ── Toast ────────────────────────────────────────────────────────────── */
  let toastTimer = null;
  function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
  }

  /* ── Modal helpers ────────────────────────────────────────────────────── */
  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  /* ── Populate edit form ───────────────────────────────────────────────── */
  function populateEditForm(todo) {
    document.getElementById('modal-heading').textContent = 'Edit Task';
    document.getElementById('modal-submit').textContent  = 'Save Changes';
    document.getElementById('todo-title').value         = todo.title;
    document.getElementById('todo-desc').value          = todo.description;
    document.getElementById('todo-priority').value      = todo.priority;
    document.getElementById('todo-due').value           = todo.dueDate || '';
    document.getElementById('todo-category').value      = todo.categoryId || '';
    document.getElementById('todo-tags').value          = todo.tags.join(', ');
  }

  function resetTodoForm() {
    document.getElementById('modal-heading').textContent = 'New Task';
    document.getElementById('modal-submit').textContent  = 'Create Task';
    document.getElementById('todo-title').value    = '';
    document.getElementById('todo-desc').value     = '';
    document.getElementById('todo-priority').value = 'medium';
    document.getElementById('todo-due').value      = '';
    document.getElementById('todo-category').value = '';
    document.getElementById('todo-tags').value     = '';
  }

  /* ── Nav active state ─────────────────────────────────────────────────── */
  function setActiveNav(filter) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }

  /* ── Priority pill active state ───────────────────────────────────────── */
  function setActivePill(priority) {
    document.querySelectorAll('.pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.priority === priority);
    });
  }

  return {
    renderTasks, renderBadges, renderCategories, renderStats,
    renderHeader, showToast, openModal, closeModal,
    populateEditForm, resetTodoForm, setActiveNav, setActivePill,
  };
})();
