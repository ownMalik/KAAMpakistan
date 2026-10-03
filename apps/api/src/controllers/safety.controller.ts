import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const reportUserOrProvider = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.id;
    const { reportedId, reason, details } = req.body;

    if (!reportedId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required.' });
    }

    if (reporterId === reportedId) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: reporterId!,
        reportedId,
        reason,
        details,
      },
    });

    return res.status(201).json({
      message: 'Report submitted successfully. Our safety team will review it.',
      report,
    });
  } catch (error) {
    console.error('Report Error:', error);
    return res.status(500).json({ error: 'Internal server error while filing report.' });
  }
};