import { Request, Response } from 'express';
import prisma from '../config/db';
import * as argon2 from 'argon2';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, is_active: true, room_id: true, room: { select: { room_name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, room_id } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    if (role === 'ROOM_USER' && !room_id) {
      return res.status(400).json({ success: false, message: 'Room must be assigned for a ROOM_USER' });
    }

    if (room_id) {
      const roomAssigned = await prisma.user.findUnique({ where: { room_id } });
      if (roomAssigned) {
         return res.status(400).json({ success: false, message: 'This room is already assigned to another user' });
      }
    }

    const password_hash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role,
        room_id: role === 'ADMIN' ? null : room_id
      },
      select: { id: true, name: true, email: true, role: true, room_id: true, is_active: true }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, role, room_id, is_active } = req.body;

    if (room_id) {
       const roomAssigned = await prisma.user.findFirst({ where: { room_id, NOT: { id } } });
       if (roomAssigned) {
          return res.status(400).json({ success: false, message: 'This room is already assigned to another user' });
       }
    }

    // Safety: Prevent demoting or deactivating the last active ADMIN
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (currentUser?.role === 'ADMIN' && (role === 'ROOM_USER' || is_active === false)) {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', is_active: true } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote or deactivate the only active administrator in the system.'
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role, room_id: role === 'ADMIN' ? null : room_id, is_active },
      select: { id: true, name: true, email: true, role: true, room_id: true, is_active: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    const password_hash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password_hash }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentAdminId = req.user?.userId;

    // 1. Prevent self-deletion
    if (id === currentAdminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account while logged in.' 
      });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Prevent deleting the last remaining admin
    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the only administrator account. At least one admin must exist in the system.' 
        });
      }
    }

    await prisma.user.delete({
      where: { id }
    });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
