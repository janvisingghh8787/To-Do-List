/**
 * app.js
 * ──────
 * Main application controller.
 * Wires together API calls (api.js) and DOM rendering (ui.js).
 *
 * State lives here — no global variables scattered elsewhere.
 */

(() => {
  // ── App state ─────────────────────────────────────────────────────────────
  const state = {
    todos:        [],       // full list from server
    categories:   [],       // all categories
    editingId:    null,     // todo id currently being edited (null = create mode)
    filter:       'all',    // sidebar filter: all | today | pending | completed | overdue
    priorityFilter: '',     // '' | urgent | high | medium | low
    categoryFilter: '',     // category id or ''
    search:       '',
    sortBy:       'created_at',
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  async function init() {
    UI.setPageDate();
    bindEvents();
    await loadAll();
  }

  // ── Load everything from the server ──────────────────────────────────────
  async function loadAll() {
    try {
      const [todosRes, catsRes, statsRes] = await Promise.all([
        API.getTodos({ sortBy: state.sortBy }),
        API.getCategories(),
        API.getStats(),
      ]);

      state.todos      = todosRes.data      || [];
      state.categories = catsRes.data       || [];

      const s = statsRes.data || {};
      UI.updateRing(s.completion_rate || 0);
      UI.updateBadges(state.todos);
      UI.renderCategories(
        state.categories,
        state.categoryFilter,
        selectCategory,
        confirmDeleteCategory,
      );
      UI.populateCategorySelect(state.categories);
      applyFiltersAndRender();
    } catch (err) {
      UI.toast('Could not connect to server. Is FastAPI running?', 'err');
      console.error(err);
    }
  }

  // ── Filtering & rendering ─────────────────────────────────────────────────
  function applyFiltersAndRender() {
    const now     = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let filtered = [...state.todos];

    // Sidebar filter
    switch (state.filter) {
      case 'today':
        filtered = filtered.filter(t =>
          t.due_date && t.due_date.slice(0, 10) === todayStr && !t.completed
        );
        break;
      case 'pending':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(t => t.is_overdue);
        break;
      case 'category':
        filtered = filtered.filter(t =>
          t.category && t.category.id === state.categoryFilter
        );
        break;
    }

    // Priority chip filter
    if (state.priorityFilter) {
      filtered = filtered.filter(t => t.priority === state.priorityFilter);
    }

    // Search
    if (state.search) {
      const q = state.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    UI.renderTodos(filtered, handleToggle, handleEditOpen, confirmDeleteTodo);
  }

  // ── Event binding ─────────────────────────────────────────────────────────
  function bindEvents() {

    // Sidebar nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter         = btn.dataset.filter;
        state.categoryFilter = '';
        UI.setPageTitle(btn.querySelector('.nav-label').textContent.trim());
        // De-select category
        document.querySelectorAll('.cat-row').forEach(r => r.classList.remove('active'));
        applyFiltersAndRender();
      });
    });

    // Priority chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.priorityFilter = chip.dataset.priority;
        applyFiltersAndRender();
      });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          state.search = searchInput.value.trim();
          applyFiltersAndRender();
        }, 280);
      });
    }

    // Sort
    const sortSel = document.getElementById('sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', async () => {
        state.sortBy = sortSel.value;
        await refreshTodos();
      });
    }

    // FAB → open create modal
    document.getElementById('fab')?.addEventListener('click', () => {
      state.editingId = null;
      UI.clearTodoForm();
      UI.populateCategorySelect(state.categories, '');
      UI.setModalMode(false);
      UI.openModal('todo-modal');
    });

    // Modal close / cancel
    document.getElementById('modal-close')?.addEventListener('click',  () => UI.closeModal('todo-modal'));
    document.getElementById('modal-cancel')?.addEventListener('click', () => UI.closeModal('todo-modal'));
    document.getElementById('todo-modal')?.addEventListener('click', e => {
      if (e.target.id === 'todo-modal') UI.closeModal('todo-modal');
    });

    // Modal submit (create or update)
    document.getElementById('modal-submit')?.addEventListener('click', handleTodoSubmit);

    // Keyboard: Escape closes any open modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        UI.closeModal('todo-modal');
        UI.closeModal('cat-modal');
      }
      // Ctrl/Cmd + N → open create modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('fab')?.click();
      }
    });

    // Add category button
    document.getElementById('add-category-btn')?.addEventListener('click', () => {
      UI.clearCatForm();
      UI.openModal('cat-modal');
    });

    // Category modal close / cancel / submit
    document.getElementById('cat-modal-close')?.addEventListener('click',  () => UI.closeModal('cat-modal'));
    document.getElementById('cat-cancel')?.addEventListener('click',       () => UI.closeModal('cat-modal'));
    document.getElementById('cat-modal')?.addEventListener('click', e => {
      if (e.target.id === 'cat-modal') UI.closeModal('cat-modal');
    });
    document.getElementById('cat-submit')?.addEventListener('click', handleCategorySubmit);

    // Hamburger (mobile sidebar)
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      if (
        sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !hamburger?.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ── Category selection (from sidebar) ────────────────────────────────────
  function selectCategory(catId) {
    // Toggle: clicking same category deselects
    if (state.categoryFilter === catId && state.filter === 'category') {
      state.filter         = 'all';
      state.categoryFilter = '';
      document.querySelector('.nav-item[data-filter="all"]')?.click();
      return;
    }

    state.filter         = 'category';
    state.categoryFilter = catId;

    // Highlight sidebar row
    document.querySelectorAll('.cat-row').forEach(r =>
      r.classList.toggle('active', r.dataset.catId === catId)
    );
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    const cat = state.categories.find(c => c.id === catId);
    UI.setPageTitle(cat ? `${cat.icon} ${cat.name}` : 'Category');
    applyFiltersAndRender();
  }

  // ── Todo handlers ─────────────────────────────────────────────────────────
  async function handleToggle(id) {
    try {
      const res  = await API.toggleTodo(id);
      const idx  = state.todos.findIndex(t => t.id === id);
      if (idx !== -1) state.todos[idx] = res.data;
      UI.updateBadges(state.todos);
      applyFiltersAndRender();
      await refreshStats();
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  function handleEditOpen(todo) {
    state.editingId = todo.id;
    UI.populateCategorySelect(state.categories, todo.category?.id || '');
    UI.fillTodoForm(todo);
    UI.setModalMode(true);
    UI.openModal('todo-modal');
  }

  async function handleTodoSubmit() {
    const data = UI.getTodoFormData();
    if (!data.title) {
      UI.toast('Title is required', 'err');
      return;
    }

    try {
      if (state.editingId) {
        // Update
        const res = await API.updateTodo(state.editingId, data);
        const idx = state.todos.findIndex(t => t.id === state.editingId);
        if (idx !== -1) state.todos[idx] = res.data;
        UI.toast('Task updated ✓', 'ok');
      } else {
        // Create
        const res = await API.createTodo(data);
        state.todos.unshift(res.data);
        UI.toast('Task created ✓', 'ok');
      }

      UI.closeModal('todo-modal');
      UI.updateBadges(state.todos);
      applyFiltersAndRender();
      await refreshStats();
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  async function confirmDeleteTodo(id) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await API.deleteTodo(id);
      state.todos = state.todos.filter(t => t.id !== id);
      UI.updateBadges(state.todos);
      applyFiltersAndRender();
      await refreshStats();
      UI.toast('Task deleted', 'ok');
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  // ── Category handlers ─────────────────────────────────────────────────────
  async function handleCategorySubmit() {
    const data = UI.getCatFormData();
    if (!data.name) {
      UI.toast('Category name is required', 'err');
      return;
    }
    try {
      const res = await API.createCategory(data);
      state.categories.push(res.data);
      UI.closeModal('cat-modal');
      UI.renderCategories(state.categories, state.categoryFilter, selectCategory, confirmDeleteCategory);
      UI.populateCategorySelect(state.categories);
      UI.toast(`Category "${res.data.name}" created ✓`, 'ok');
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  async function confirmDeleteCategory(id) {
    const cat = state.categories.find(c => c.id === id);
    if (!confirm(`Delete category "${cat?.name}"? Tasks will be uncategorised.`)) return;
    try {
      await API.deleteCategory(id);
      state.categories = state.categories.filter(c => c.id !== id);

      // Remove category from local todos too
      state.todos = state.todos.map(t =>
        t.category?.id === id ? { ...t, category: null } : t
      );

      if (state.categoryFilter === id) {
        state.filter         = 'all';
        state.categoryFilter = '';
        document.querySelector('.nav-item[data-filter="all"]')?.click();
      }

      UI.renderCategories(state.categories, state.categoryFilter, selectCategory, confirmDeleteCategory);
      UI.populateCategorySelect(state.categories);
      applyFiltersAndRender();
      UI.toast('Category deleted', 'ok');
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  // ── Refresh helpers ───────────────────────────────────────────────────────
  async function refreshTodos() {
    try {
      const res    = await API.getTodos({ sortBy: state.sortBy });
      state.todos  = res.data || [];
      UI.updateBadges(state.todos);
      applyFiltersAndRender();
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  async function refreshStats() {
    try {
      const res = await API.getStats();
      UI.updateRing(res.data.completion_rate || 0);
    } catch (_) { /* silent */ }
  }

  // ── Start the app ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
