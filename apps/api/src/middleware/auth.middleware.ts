import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    phone: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
      phone: string;
    };
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== role && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Unauthorized access for this role' });
    }
    next();
  };
};