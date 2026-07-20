const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { localUsers, isDbConnected } = require('./mockData');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  // HARDCODED BYPASS FOR TESTING WITHOUT MONGODB
  const identifierLower = identifier.toLowerCase();
  const isBypass =
    (identifierLower === 'alivpsuahim@gmail.com' ||
     identifierLower === 'alivpsuahim' ||
     identifierLower === 'alivpsuhaim') &&
    password === '123456';

  if (isBypass) {
    return res.json({
      _id: 'mock-id-12345',
      username: 'alivpsuahim',
      email: 'alivpsuahim@gmail.com',
      role: 'Administrator',
      token: generateToken('mock-id-12345'),
    });
  }

  // Local fallback if DB is not connected
  if (!isDbConnected()) {
    const searchId = identifier.toLowerCase();
    const localUser = localUsers.find(
      (u) =>
        u.email.toLowerCase() === searchId ||
        u.username.toLowerCase() === searchId ||
        ((searchId.includes('alivpsuhaim') || searchId.includes('alivpsuahim')) && u.username === 'alivpsuahim')
    );

    if (!localUser) {
      return res.status(401).json({ message: 'Invalid email or username (Local Mode)' });
    }

    if (!localUser.isActive) {
      return res.status(403).json({ message: 'Account is inactive (Local Mode)' });
    }

    // Accept standard test passwords
    const isPassValid =
      password === 'password123' ||
      password === '123456' ||
      (localUser.username.startsWith('alivps') && password === '123456');

    if (isPassValid) {
      return res.json({
        _id: localUser._id,
        username: localUser.username,
        email: localUser.email,
        role: localUser.role,
        token: generateToken(localUser._id),
      });
    } else {
      return res.status(401).json({ message: 'Incorrect login credentials (Local Mode)' });
    }
  }

  try {
    // Find user by either email or username
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or username' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Incorrect login credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Database connection error. Please ensure MongoDB is running.' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  if (req.user._id === 'mock-id-12345' || req.user.id === 'mock-id-12345') {
    return res.json({
      _id: 'mock-id-12345',
      username: 'alivpsuahim',
      email: 'alivpsuahim@gmail.com',
      role: 'Administrator',
    });
  }

  if (!isDbConnected()) {
    const localUser = localUsers.find(
      (u) => u._id === req.user._id || u._id === req.user.id
    );

    if (localUser) {
      return res.json({
        _id: localUser._id,
        username: localUser.username,
        email: localUser.email,
        role: localUser.role,
      });
    } else {
      return res.status(404).json({ message: 'User not found (Local Mode)' });
    }
  }

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Database connection error' });
  }
};

module.exports = {
  loginUser,
  getUserProfile,
};
