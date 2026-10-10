import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing. Please log in to proceed.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] role. Your role is '${req.user.role}'. (BR10)`,
      });
    }

    next();
  };
};
