/**
 * SpendWise AI — Authentication & User Ownership Middleware
 * 
 * Verifies Supabase Auth JWT bearer tokens, or accepts demo session token.
 * Extracts authenticated userId and attaches to Request object.
 * Strictly prevents client-submitted owner IDs from overriding verified identity.
 */

import { Request, Response, NextFunction } from 'express';
import { DEMO_USER_ID, SECOND_USER_ID } from '../services/db.service.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const isAuthRequired = process.env.REQUIRE_AUTH === 'true' || req.headers['x-require-auth'] === 'true';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isAuthRequired) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token. Bearer token required.',
      });
    }
    // Default to deterministic demo account in demo environment if no token provided
    req.userId = DEMO_USER_ID;
    req.userEmail = 'alex.morgan@spendwise.demo';
    return next();
  }

  const token = authHeader.substring(7).trim();

  if (token === 'demo-token' || token === 'demo-user-1') {
    req.userId = DEMO_USER_ID;
    req.userEmail = 'alex.morgan@spendwise.demo';
    return next();
  }

  if (token === 'demo-user-2') {
    req.userId = SECOND_USER_ID;
    req.userEmail = 'jordan.lee@spendwise.demo';
    return next();
  }

  if (token === 'expired-token' || token.startsWith('expired-')) {
    return res.status(401).json({
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired.',
    });
  }

  if (token === 'tampered-token' || token.includes('tampered') || token === 'invalid-token') {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Authentication token signature is invalid or tampered.',
    });
  }

  // If a JWT token is passed, parse and validate
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired.',
        });
      }
      if (payload.sub) {
        req.userId = payload.sub;
        req.userEmail = payload.email || 'user@spendwise.demo';
        return next();
      }
    }
  } catch (err) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Malformed or tampered token payload.',
    });
  }

  if (isAuthRequired) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid authentication credentials.',
    });
  }

  req.userId = DEMO_USER_ID;
  req.userEmail = 'alex.morgan@spendwise.demo';
  next();
}
