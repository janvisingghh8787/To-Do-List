const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// ─── GET /api/stats ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [total, completed, overdue, byPriority] = await Promise.all([
      Todo.countDocuments(),
      Todo.countDocuments({ completed: true }),
      Todo.countDocuments({ completed: false, dueDate: { $lt: new Date() } }),
      Todo.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const priorityMap = { low: 0, medium: 0, high: 0, urgent: 0 };
    byPriority.forEach(({ _id, count }) => {
      if (_id in priorityMap) priorityMap[_id] = count;
    });

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        overdue,
        completionRate,
        byPriority: priorityMap,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
