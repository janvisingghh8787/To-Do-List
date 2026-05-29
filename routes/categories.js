const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Todo = require('../models/Todo');

// ─── GET /api/categories ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/categories ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const category = new Category({ name: name.trim(), color, icon });
    const saved = await category.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/categories/:id ──────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Unlink todos from deleted category
    await Todo.updateMany({ category: req.params.id }, { category: null });

    res.json({ success: true, message: 'Category deleted and todos unlinked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
