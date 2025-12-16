/**
 * Notifications Controller
 * 
 * API endpoints for fetching and managing in-app notifications
 */

import type { Response } from 'express';
import prisma from '../../prisma/client.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';

/**
 * Get all notifications for current user
 */
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { unreadOnly, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.update({
      where: {
        id,
        userId, // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { updatedCount: result.count },
    });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
