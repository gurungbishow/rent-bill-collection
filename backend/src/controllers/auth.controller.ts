import { Request, Response } from 'express';
import prisma from '../config/db';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, roomId: user.room_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        room_id: user.room_id,
        roomId: user.room_id,
        token // Return token for mobile clients that might not use cookies
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        room_id: true,
        is_active: true,
        room: {
          select: {
            id: true,
            room_name: true,
            enrollment_date: true
          }
        }
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        roomId: user.room_id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isValid = await argon2.verify(user.password_hash, currentPassword);
    if (!isValid) return res.status(400).json({ success: false, message: 'Incorrect current password' });

    const newHash = await argon2.hash(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash }
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

export const directResetPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, email, newPassword } = req.body;
    const searchTarget = (identifier || email || '').toString().trim();

    if (!searchTarget) {
      return res.status(400).json({ success: false, message: 'Email address or room name is required' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // 1. Find user by email (case-insensitive)
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: searchTarget,
          mode: 'insensitive'
        }
      },
      include: {
        room: true
      }
    });

    // 2. If not found by email, check if it matches a room name (for tenants)
    if (!user) {
      const room = await prisma.room.findFirst({
        where: {
          room_name: {
            equals: searchTarget,
            mode: 'insensitive'
          }
        },
        include: {
          user: true
        }
      });
      if (room && room.user) {
        user = { ...room.user, room };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found matching this email or room' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact the administrator.' });
    }

    const password_hash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });

    // Log to AuditLog (non-blocking)
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'DIRECT_PASSWORD_RESET',
        entity_type: 'USER',
        entity_id: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          room_name: user.room?.room_name || null
        }
      }
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

