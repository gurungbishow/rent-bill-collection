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
