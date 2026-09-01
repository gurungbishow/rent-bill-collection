import { Request, Response } from 'express';
import prisma from '../config/db';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        settings: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { room_name: 'asc' }
    });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { room_name, enrollment_date } = req.body;
    
    const existing = await prisma.room.findUnique({ where: { room_name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Room name already exists' });
    }

    const room = await prisma.room.create({
      data: {
        room_name,
        enrollment_date: enrollment_date ? new Date(enrollment_date) : null,
        settings: {
          create: {
            default_water_bill: 150,
            default_electric_rate: 15
          }
        }
      },
      include: { settings: true }
    });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        settings: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { room_name, is_active, enrollment_date } = req.body;

    if (room_name) {
      const existing = await prisma.room.findFirst({
        where: { room_name, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Room name already exists' });
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(room_name !== undefined ? { room_name } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        ...(enrollment_date !== undefined ? { enrollment_date: enrollment_date ? new Date(enrollment_date) : null } : {})
      }
    });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
};

export const getRoomSettings = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const settings = await prisma.roomSettings.findUnique({
      where: { room_id: id }
    });
    
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const updateRoomSettings = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    if (data.room_name || data.enrollment_date !== undefined) {
      if (data.room_name) {
        const existing = await prisma.room.findFirst({
          where: { room_name: data.room_name, NOT: { id } }
        });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Room name already exists' });
        }
      }
      await prisma.room.update({
        where: { id },
        data: {
          ...(data.room_name ? { room_name: data.room_name } : {}),
          ...(data.enrollment_date !== undefined ? { enrollment_date: data.enrollment_date ? new Date(data.enrollment_date) : null } : {})
        }
      });
    }

    const settings = await prisma.roomSettings.update({
      where: { room_id: id },
      data: {
        default_water_bill: data.default_water_bill,
        default_waste_bill: data.default_waste_bill,
        default_wifi_bill: data.default_wifi_bill,
        wifi_enabled: data.wifi_enabled,
        starting_electric_unit: data.starting_electric_unit,
        default_room_rent: data.default_room_rent,
        default_electric_rate: data.default_electric_rate,
        prorate_rent: data.prorate_rent !== undefined ? data.prorate_rent : undefined,
        prorate_water: data.prorate_water !== undefined ? data.prorate_water : undefined,
        prorate_waste: data.prorate_waste !== undefined ? data.prorate_waste : undefined,
        prorate_wifi: data.prorate_wifi !== undefined ? data.prorate_wifi : undefined
      }
    });

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if room exists
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unassign user
      await tx.user.updateMany({
        where: { room_id: id },
        data: { room_id: null }
      });
      
      // 2. Find all bills for this room to delete payments
      const bills = await tx.monthlyBill.findMany({ 
        where: { room_id: id }, 
        select: { id: true } 
      });
      const billIds = bills.map(b => b.id);
      
      if (billIds.length > 0) {
        // Delete payments
        await tx.payment.deleteMany({
          where: { monthly_bill_id: { in: billIds } }
        });
      }
      
      // 3. Delete Bills
      await tx.monthlyBill.deleteMany({
        where: { room_id: id }
      });
      
      // 4. Delete Settings
      await tx.roomSettings.deleteMany({
        where: { room_id: id }
      });
      
      // 5. Delete Room
      await tx.room.delete({
        where: { id }
      });
    });

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
};
