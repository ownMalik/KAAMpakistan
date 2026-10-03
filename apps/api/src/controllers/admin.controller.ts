import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const getAdminDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all independent counts concurrently for optimal performance
    const [totalUsers, totalProviders, totalRequests, totalReviews, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.providerProfile.count(),
      prisma.serviceRequest.count(),
      prisma.review.count(),
      prisma.report.count({ where: { isResolved: false } }),
    ]);

    const recentReports = await prisma.report.findMany({
      where: { isResolved: false },
      include: {
        reporter: { select: { fullName: true, phone: true } },
        reported: { select: { fullName: true, phone: true } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      stats: {
        totalUsers,
        totalProviders,
        totalRequests,
        totalReviews,
        pendingReports,
      },
      recentReports,
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching admin dashboard stats.' });
  }
};

export const resolveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { isResolved: true },
    });

    return res.json({ message: 'Report marked as resolved.', report });
  } catch (error) {
    console.error('Resolve Report Error:', error);
    return res.status(500).json({ error: 'Internal server error resolving report.' });
  }
};

export const verifyProviderAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { providerId } = req.params;
    const { isVerified } = req.body;

    const provider = await prisma.providerProfile.update({
      where: { id: providerId },
      data: { isVerified: Boolean(isVerified) },
    });

    return res.json({ 
      message: `Provider verification status updated successfully.`, 
      provider 
    });
  } catch (error) {
    console.error('Provider Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error updating verification status.' });
  }
};