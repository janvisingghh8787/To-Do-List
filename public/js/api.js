/**
 * api.js — Opus Todo · Data Layer
 * Handles all localStorage persistence for todos and categories.
 */

const API = (() => {
  const TODOS_KEY      = 'opus_todos';
  const CATEGORIES_KEY = 'opus_categories';

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const load  = key       => JSON.parse(localStorage.getItem(key) || '[]');
  const save  = (key, v)  => localStorage.setItem(key, JSON.stringify(v));
  const genId = ()        => `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  /* ── Categories ───────────────────────────────────────────────────────── */
  function getCategories() {
    return load(CATEGORIES_KEY);
  }

  function addCategory({ name, color = '#6366f1', icon = '📁' }) {
    if (!name?.trim()) throw new Error('Category name required');
    const cats = getCategories();
    const cat  = { id: genId(), name: name.trim(), color, icon };
    cats.push(cat);
    save(CATEGORIES_KEY, cats);
    return cat;
  }

  function deleteCategory(id) {
    const cats = getCategories().filter(c => c.id !== id);
    save(CATEGORIES_KEY, cats);
    // Remove category reference from todos
    const todos = getTodos().map(t => t.categoryId === id ? { ...t, categoryId: '' } : t);
    save(TODOS_KEY, todos);
  }

  /* ── Todos ────────────────────────────────────────────────────────────── */
  function getTodos() {
    return load(TODOS_KEY);
  }

  function addTodo({ title, description = '', priority = 'medium', dueDate = '', categoryId = '', tags = [] }) {
    if (!title?.trim()) throw new Error('Title is required');
    const todos = getTodos();
    const todo  = {
      id:          genId(),
      title:       title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      categoryId,
      tags:        Array.isArray(tags) ? tags : [],
      completed:   false,
      createdAt:   new Date().toISOString(),
      completedAt: null,
    };
    todos.unshift(todo);
    save(TODOS_KEY, todos);
    return todo;
  }

  function updateTodo(id, patch) {
    const todos = getTodos().map(t => t.id === id ? { ...t, ...patch } : t);
    save(TODOS_KEY, todos);
    return todos.find(t => t.id === id);
  }

  function deleteTodo(id) {
    const todos = getTodos().filter(t => t.id !== id);
    save(TODOS_KEY, todos);
  }

  function toggleTodo(id) {
    const todo = getTodos().find(t => t.id === id);
    if (!todo) return;
    return updateTodo(id, {
      completed:   !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : null,
    });
  }

  /* ── Filters & Sort ───────────────────────────────────────────────────── */
  function isOverdue(todo) {
    if (!todo.dueDate || todo.completed) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(todo.dueDate) < today;
  }

  function isToday(todo) {
    if (!todo.dueDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return todo.dueDate === today;
  }

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

  function filterAndSort(filter = 'all', priorityFilter = '', search = '', sortBy = 'createdAt', categoryFilter = '') {
    let todos = getTodos();

    // Category filter
    if (categoryFilter) {
      todos = todos.filter(t => t.categoryId === categoryFilter);
    }

    // Main filter
    if (filter === 'today')     todos = todos.filter(isToday);
    if (filter === 'pending')   todos = todos.filter(t => !t.completed);
    if (filter === 'completed') todos = todos.filter(t =>  t.completed);
    if (filter === 'overdue')   todos = todos.filter(isOverdue);

    // Priority pill
    if (priorityFilter) todos = todos.filter(t => t.priority === priorityFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    todos = [...todos].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      }
      // createdAt (default — newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return todos;
  }

  /* ── Badge counts ─────────────────────────────────────────────────────── */
  function getCounts() {
    const all = getTodos();
    return {
      all:       all.length,
      today:     all.filter(isToday).length,
      pending:   all.filter(t => !t.completed).length,
      completed: all.filter(t =>  t.completed).length,
      overdue:   all.filter(isOverdue).length,
    };
  }

  /* ── Public API ───────────────────────────────────────────────────────── */
  return {
    getCategories, addCategory, deleteCategory,
    getTodos, addTodo, updateTodo, deleteTodo, toggleTodo,
    filterAndSort, getCounts, isOverdue, isToday,
  };
})();
