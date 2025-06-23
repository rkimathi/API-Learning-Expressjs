const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const { taskValidationRules, validate } = require('../middleware/validators');


// All routes in this file will be protected by authMiddleware by default if mounted with it
// router.use(authMiddleware); // This would apply to all routes defined AFTER this line in this file.
// Or, apply middleware individually or when mounting the router in index.js.
// For now, assuming it will be applied when mounting in index.js for all /api/tasks routes.

// POST /api/tasks - Create a new task
router.post('/', authMiddleware, taskValidationRules(), validate, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;
    const newTask = new Task({
      user: req.user.id, // From authMiddleware
      title,
      description,
      status,
      dueDate,
    });

    const task = await newTask.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ msg: 'Server error while creating task' });
  }
});

// GET /api/tasks - Get all tasks for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }); // Sort by newest first
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ msg: 'Server error while fetching tasks' });
  }
});

// GET /api/tasks/:id - Get a specific task by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Ensure the task belongs to the logged-in user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to access this task' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task by ID:', error.message);
    if (error.kind === 'ObjectId') { // Mongoose specific error for invalid ObjectId format
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    res.status(500).json({ msg: 'Server error while fetching task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', authMiddleware, taskValidationRules(), validate, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Ensure the task belongs to the logged-in user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this task' });
    }

    const { title, description, status, dueDate } = req.body;

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description; // Allow empty string
    if (status) task.status = status;
    if (dueDate) task.dueDate = dueDate;
    // To remove dueDate, client should send null or a specific signal if API supports it
    // For now, if dueDate is not provided in body, it's not changed. If null is sent, it's set to null.


    task = await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    res.status(500).json({ msg: 'Server error while updating task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Ensure the task belongs to the logged-in user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this task' });
    }

    // await task.remove(); // remove() is deprecated
    await Task.findByIdAndDelete(req.params.id);


    res.json({ msg: 'Task removed successfully' });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    res.status(500).json({ msg: 'Server error while deleting task' });
  }
});


module.exports = router;
