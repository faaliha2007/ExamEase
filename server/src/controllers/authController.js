import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/environment.js';

export const DEMO_ACCOUNTS = [
  {
    email: 'user1@examease.demo',
    role: 'USER',
    name: 'Alice Johnson (Candidate 1)',
  },
  {
    email: 'user2@examease.demo',
    role: 'USER',
    name: 'Bob Smith (Candidate 2)',
  },
  {
    email: 'admin@examease.demo',
    role: 'ADMIN',
    name: 'Dr. Evelyn Vance (Exam Controller)',
  },
];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export class AuthController {
  /**
   * POST /api/auth/demo-login
   * Simulated demo login with server-enforced identity and role
   */
  static async demoLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required for demo login',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find user in database
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Demo user with email '${normalizedEmail}' not found. Please ensure database has been seeded.`,
        });
      }

      // If password provided, verify with bcrypt
      if (password) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials for demo account',
          });
        }
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: `Successfully authenticated as ${user.name} (${user.role})`,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Return currently authenticated user profile
   */
  static async getMe(req, res) {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
      },
    });
  }

  /**
   * GET /api/auth/demo-accounts
   * Return list of available demo accounts for the UI selector
   */
  static async getDemoAccounts(req, res) {
    res.status(200).json({
      success: true,
      accounts: DEMO_ACCOUNTS,
    });
  }
}
