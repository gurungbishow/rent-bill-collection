import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    roomId?: string | null;
  };
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      roomId: decoded.roomId,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const requireRoomAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const requestedRoomId = req.params.id || req.params.roomId;
  
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (req.user?.role === 'ROOM_USER') {
    if (req.user.roomId === requestedRoomId) {
      return next();
    }
  }
  
  return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this room' });
};

export const requireBillAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const billId = req.params.id || req.params.billId;
    
    const bill = await prisma.monthlyBill.findUnique({ where: { id: billId } });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (req.user?.role === 'ROOM_USER' && req.user.roomId === bill.room_id) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this bill' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
