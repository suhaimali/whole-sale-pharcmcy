const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { localUsers, isDbConnected } = require('./mockData');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
const getUsers = async (req, res) => {
  if (isDbConnected()) {
    try {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    res.json(localUsers);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin, Super Admin)
const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (isDbConnected()) {
    try {
      const userExists = await User.findOne({ $or: [{ email }, { username }] });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        username,
        email,
        password,
        role,
        isActive: true,
      });

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const userExists = localUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.username === username
    );

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
      _id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      role: role || 'Sales Staff',
      isActive: true,
      createdAt: new Date(),
    };

    localUsers.push(newUser);
    res.status(201).json(newUser);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle
// @access  Private (Admin, Super Admin)
const toggleUserActive = async (req, res) => {
  if (isDbConnected()) {
    try {
      const user = await User.findById(req.params.id);

      if (user) {
        // Prevent self-deactivation
        if (user._id.toString() === req.user._id.toString()) {
          return res.status(400).json({ message: 'You cannot deactivate your own account' });
        }

        user.isActive = !user.isActive;
        await user.save();
        res.json({
          _id: user._id,
          username: user.username,
          isActive: user.isActive,
        });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localUsers.findIndex((u) => u._id === req.params.id);

    if (index !== -1) {
      if (localUsers[index]._id === req.user._id) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }

      localUsers[index].isActive = !localUsers[index].isActive;
      res.json({
        _id: localUsers[index]._id,
        username: localUsers[index].username,
        isActive: localUsers[index].isActive,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  }
};

module.exports = {
  getUsers,
  createUser,
  toggleUserActive,
};
