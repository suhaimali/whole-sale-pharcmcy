const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { localUsers, isDbConnected } = require('../controllers/mockData');

const MOCK_ADMIN = {
  _id: 'mock-id-12345',
  id: 'mock-id-12345',
  username: 'alivpsuhaim',
  email: 'alivpsuhaim@gmail.com',
  role: 'Administrator',
  isActive: true,
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Hard-coded mock token bypass
      if (token === 'mock-id-12345-token') {
        req.user = MOCK_ADMIN;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Known mock admin ID bypass
      if (decoded.id === 'mock-id-12345') {
        req.user = MOCK_ADMIN;
        return next();
      }

      // In-memory fallback: find user in mock data without hitting DB
      if (!isDbConnected()) {
        const mockUser = localUsers.find(
          (u) => u._id === decoded.id || u._id === decoded.id
        );
        if (mockUser && mockUser.isActive) {
          req.user = { ...mockUser, id: mockUser._id };
          return next();
        }
        // Fallback to admin for any valid JWT in offline mode
        req.user = MOCK_ADMIN;
        return next();
      }

      // Normal DB lookup
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, not authorized' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      next();
    } catch (error) {
      // If DB is offline and JWT verify fails, try offline fallback
      if (!isDbConnected()) {
        req.user = MOCK_ADMIN;
        return next();
      }
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
