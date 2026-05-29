const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// ─── GET /api/todos ───────────────────────────────────────────────────────────
// Fetch all todos with optional filters: ?completed=true/false&priority=high&category=id&search=text
router.get('/', async (req, res) => {
  try {
    const { completed, priority, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};

    if (completed !== undefined) filter.completed = completed === 'true';
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const todos = await Todo.find(filter)
      .populate('category', 'name color icon')
      .sort(sortOptions);

    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/todos/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id).populate('category', 'name color icon');
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/todos ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const todo = new Todo({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      category: category || null,
      dueDate: dueDate || null,
      tags: tags || [],
    });

    const saved = await todo.save();
    const populated = await saved.populate('category', 'name color icon');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/todos/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Trim string fields
    if (updates.title) updates.title = updates.title.trim();
    if (updates.description) updates.description = updates.description.trim();

    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    Object.assign(todo, updates);
    const saved = await todo.save();
    const populated = await saved.populate('category', 'name color icon');

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/todos/:id/toggle ─────────────────────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    todo.completed = !todo.completed;
    const saved = await todo.save();
    const populated = await saved.populate('category', 'name color icon');

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/todos/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/todos/completed/all ─────────────────────────────────────────
router.delete('/completed/all', async (req, res) => {
  try {
    const result = await Todo.deleteMany({ completed: true });
    res.json({ success: true, message: `Deleted ${result.deletedCount} completed todos` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
