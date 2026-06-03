/**
 * api.js
 * ──────
 * Every HTTP call to the FastAPI backend lives here.
 * The rest of the app never uses fetch() directly — it calls these functions.
 *
 * Base URL: same origin (FastAPI serves the frontend too)
 */

const API = (() => {
  const BASE = '/api';

  // ── Generic request helper ────────────────────────────────────────────────
  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      // FastAPI returns { detail: "..." } on errors
      throw new Error(data.detail || data.message || 'Request failed');
    }
    return data;
  }

  // ════════════════════════════════════════════════════════════
  // TODOS
  // ════════════════════════════════════════════════════════════

  /**
   * Fetch all todos with optional filters.
   * @param {Object} params - { completed, priority, category, search, sortBy, order }
   */
  async function getTodos(params = {}) {
    const qs = new URLSearchParams();
    if (params.completed  !== undefined && params.completed !== null) qs.set('completed',  params.completed);
    if (params.priority)  qs.set('priority',  params.priority);
    if (params.category)  qs.set('category',  params.category);
    if (params.search)    qs.set('search',    params.search);
    if (params.sortBy)    qs.set('sortBy',    params.sortBy);
    if (params.order)     qs.set('order',     params.order);

    const query = qs.toString() ? `?${qs}` : '';
    return request('GET', `/todos/${query}`);
  }

  /**
   * Create a new todo.
   * @param {Object} payload - { title, description, priority, category_id, due_date, tags }
   */
  async function createTodo(payload) {
    return request('POST', '/todos/', payload);
  }

  /**
   * Update an existing todo.
   * @param {string} id
   * @param {Object} payload - any subset of todo fields
   */
  async function updateTodo(id, payload) {
    return request('PUT', `/todos/${id}`, payload);
  }

  /**
   * Toggle completed status of a todo.
   * @param {string} id
   */
  async function toggleTodo(id) {
    return request('PATCH', `/todos/${id}/toggle`, {});
  }

  /**
   * Delete a single todo.
   * @param {string} id
   */
  async function deleteTodo(id) {
    return request('DELETE', `/todos/${id}`);
  }

  /**
   * Delete all completed todos at once.
   */
  async function deleteCompleted() {
    return request('DELETE', '/todos/completed/all');
  }

  // ════════════════════════════════════════════════════════════
  // CATEGORIES
  // ════════════════════════════════════════════════════════════

  async function getCategories() {
    return request('GET', '/categories/');
  }

  /**
   * @param {Object} payload - { name, color, icon }
   */
  async function createCategory(payload) {
    return request('POST', '/categories/', payload);
  }

  /**
   * @param {string} id
   */
  async function deleteCategory(id) {
    return request('DELETE', `/categories/${id}`);
  }

  // ════════════════════════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════════════════════════

  async function getStats() {
    return request('GET', '/stats/');
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    getTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    deleteCompleted,
    getCategories,
    createCategory,
    deleteCategory,
    getStats,
  };
})();
