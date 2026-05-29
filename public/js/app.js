/**
 * app.js — Opus Todo · App Controller
 * Wires DOM events → API calls → UI renders. Owns all mutable state.
 */

(() => {
  /* ── State ──────────────────────────────────────────────────────────── */
  let state = {
    filter:         'all',      // all | today | pending | completed | overdue
    priorityFilter: '',         // '' | urgent | high | medium | low
    search:         '',
    sortBy:         'createdAt',
    categoryFilter: '',         // category id or ''
    editingId:      null,       // todo id being edited, or null for new
  };

  /* ── Full re-render ─────────────────────────────────────────────────── */
  function render() {
    const todos      = API.filterAndSort(
      state.filter, state.priorityFilter,
      state.search, state.sortBy, state.categoryFilter
    );
    const categories = API.getCategories();

    UI.renderTasks(todos, categories);
    UI.renderBadges();
    UI.renderCategories(state.categoryFilter);
    UI.renderStats();
    UI.renderHeader(state.filter);
    UI.setActiveNav(state.filter);
    UI.setActivePill(state.priorityFilter);
  }

  /* ── Sidebar nav filter ─────────────────────────────────────────────── */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter         = btn.dataset.filter;
      state.categoryFilter = '';
      render();
      // On mobile, close sidebar after selection
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });

  /* ── Category click in sidebar ──────────────────────────────────────── */
  document.getElementById('category-list').addEventListener('click', e => {
    // Delete button
    const delId = e.target.dataset.catDel;
    if (delId) {
      API.deleteCategory(delId);
      if (state.categoryFilter === delId) state.categoryFilter = '';
      UI.showToast('Category deleted', 'error');
      render();
      return;
    }
    // Cat item click — filter by category
    const item = e.target.closest('.cat-item');
    if (item) {
      const id = item.dataset.catId;
      state.categoryFilter = state.categoryFilter === id ? '' : id;
      state.filter         = 'all';
      render();
    }
  });

  /* ── Priority pills ─────────────────────────────────────────────────── */
  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.priorityFilter = btn.dataset.priority;
      render();
    });
  });

  /* ── Search ─────────────────────────────────────────────────────────── */
  document.getElementById('search-input').addEventListener('input', e => {
    state.search = e.target.value;
    render();
  });

  /* ── Sort ───────────────────────────────────────────────────────────── */
  document.getElementById('sort-select').addEventListener('change', e => {
    state.sortBy = e.target.value;
    render();
  });

  /* ── Mobile menu toggle ─────────────────────────────────────────────── */
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  /* ── FAB / open add modal ───────────────────────────────────────────── */
  document.getElementById('fab-add').addEventListener('click', () => {
    state.editingId = null;
    UI.resetTodoForm();
    UI.openModal('todo-modal');
    setTimeout(() => document.getElementById('todo-title').focus(), 60);
  });

  /* ── Close todo modal ───────────────────────────────────────────────── */
  function closeTodoModal() {
    UI.closeModal('todo-modal');
    state.editingId = null;
  }
  document.getElementById('modal-close').addEventListener('click', closeTodoModal);
  document.getElementById('modal-cancel').addEventListener('click', closeTodoModal);
  document.getElementById('todo-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTodoModal();
  });

  /* ── Submit todo form ───────────────────────────────────────────────── */
  document.getElementById('modal-submit').addEventListener('click', () => {
    const title      = document.getElementById('todo-title').value.trim();
    const description = document.getElementById('todo-desc').value.trim();
    const priority   = document.getElementById('todo-priority').value;
    const dueDate    = document.getElementById('todo-due').value;
    const categoryId = document.getElementById('todo-category').value;
    const tagsRaw    = document.getElementById('todo-tags').value;
    const tags       = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

    if (!title) {
      UI.showToast('Please enter a task title', 'error');
      document.getElementById('todo-title').focus();
      return;
    }

    if (state.editingId) {
      API.updateTodo(state.editingId, { title, description, priority, dueDate, categoryId, tags });
      UI.showToast('Task updated ✓', 'success');
    } else {
      API.addTodo({ title, description, priority, dueDate, categoryId, tags });
      UI.showToast('Task created ✓', 'success');
    }

    closeTodoModal();
    render();
  });

  // Allow Enter key to submit in title field
  document.getElementById('todo-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('modal-submit').click();
  });

  /* ── Task list actions (toggle / edit / delete) ─────────────────────── */
  document.getElementById('task-list').addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    const id     = actionEl.dataset.id;

    if (action === 'toggle') {
      API.toggleTodo(id);
      render();
      return;
    }

    if (action === 'edit') {
      const todo = API.getTodos().find(t => t.id === id);
      if (!todo) return;
      state.editingId = id;
      // Make sure categories are rendered in the select before populating
      UI.renderCategories(state.categoryFilter);
      UI.populateEditForm(todo);
      UI.openModal('todo-modal');
      setTimeout(() => document.getElementById('todo-title').focus(), 60);
      return;
    }

    if (action === 'delete') {
      API.deleteTodo(id);
      UI.showToast('Task deleted', 'error');
      render();
      return;
    }
  });

  /* ── Add Category modal ─────────────────────────────────────────────── */
  document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('cat-name').value  = '';
    document.getElementById('cat-color').value = '#6366f1';
    document.getElementById('cat-icon').value  = '📁';
    UI.openModal('category-modal');
    setTimeout(() => document.getElementById('cat-name').focus(), 60);
  });

  function closeCatModal() { UI.closeModal('category-modal'); }
  document.getElementById('cat-modal-close').addEventListener('click', closeCatModal);
  document.getElementById('cat-modal-cancel').addEventListener('click', closeCatModal);
  document.getElementById('category-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCatModal();
  });

  document.getElementById('cat-modal-submit').addEventListener('click', () => {
    const name  = document.getElementById('cat-name').value.trim();
    const color = document.getElementById('cat-color').value;
    const icon  = document.getElementById('cat-icon').value.trim() || '📁';

    if (!name) {
      UI.showToast('Please enter a category name', 'error');
      document.getElementById('cat-name').focus();
      return;
    }

    API.addCategory({ name, color, icon });
    UI.showToast(`Category "${name}" created ✓`, 'success');
    closeCatModal();
    render();
  });

  document.getElementById('cat-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('cat-modal-submit').click();
  });

  /* ── Keyboard shortcuts ─────────────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    // Esc closes any open modal
    if (e.key === 'Escape') {
      closeTodoModal();
      closeCatModal();
    }
    // Ctrl/Cmd + K → focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
    // n → open new task (when not focused in an input)
    if (e.key === 'n' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
      state.editingId = null;
      UI.resetTodoForm();
      UI.openModal('todo-modal');
      setTimeout(() => document.getElementById('todo-title').focus(), 60);
    }
  });

  /* ── Seed demo data on first launch ─────────────────────────────────── */
  function seedDemo() {
    if (API.getTodos().length > 0) return;

    const today    = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const work     = API.addCategory({ name: 'Work',     color: '#6366f1', icon: '💼' });
    const personal = API.addCategory({ name: 'Personal', color: '#f472b6', icon: '🌿' });
    const learning = API.addCategory({ name: 'Learning', color: '#34d399', icon: '📚' });

    API.addTodo({ title: 'Review Q3 performance report', description: 'Analyse KPIs and prepare slides for the leadership sync.', priority: 'urgent', dueDate: today,     categoryId: work.id,     tags: ['report','q3'] });
    API.addTodo({ title: 'Fix login page bug on mobile', description: 'Button overlaps keyboard on iOS Safari.',                    priority: 'high',   dueDate: today,     categoryId: work.id,     tags: ['bug','mobile'] });
    API.addTodo({ title: 'Read "Atomic Habits" ch. 4–6',  description: '',                                                            priority: 'medium', dueDate: tomorrow,  categoryId: learning.id, tags: ['book'] });
    API.addTodo({ title: 'Grocery shopping',              description: 'Milk, eggs, sourdough, avocados.',                           priority: 'low',    dueDate: today,     categoryId: personal.id, tags: ['errands'] });
    API.addTodo({ title: 'Set up CI/CD pipeline',         description: 'Configure GitHub Actions for the new monorepo.',             priority: 'high',   dueDate: tomorrow,  categoryId: work.id,     tags: ['devops'] });
    API.addTodo({ title: 'Morning workout',               description: '30 min run + 15 min stretching.',                           priority: 'medium', dueDate: today,     categoryId: personal.id, tags: ['health'] });
    const overdueTask = API.addTodo({ title: 'Submit tax documents',  description: 'Upload PDF to the portal and confirm receipt.',  priority: 'urgent', dueDate: yesterday, categoryId: personal.id, tags: ['finance'] });
    API.addTodo({ title: 'Write unit tests for API layer', description: 'Cover edge cases for auth and data endpoints.',            priority: 'medium', dueDate: '',        categoryId: work.id,     tags: ['testing'] });
    const doneTask = API.addTodo({ title: 'Update project README',    description: '',                                               priority: 'low',    dueDate: '',        categoryId: work.id,     tags: ['docs'] });
    API.toggleTodo(doneTask.id);
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */
  seedDemo();
  render();
})();
