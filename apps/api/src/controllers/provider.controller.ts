import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

// 6.1 & 6.2: Get or Initialize Provider Profile
export const getMyProviderProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, phone: true, city: true, area: true, avatarUrl: true } },
        skills: { include: { service: { include: { subcategory: { include: { category: true } } } } } },
        portfolio: true,
        serviceAreas: { include: { area: { include: { city: true } } } },
      },
    });

    if (!profile) {
      // Auto-provision if missing
      profile = await prisma.providerProfile.create({
        data: { userId },
        include: {
          user: { select: { fullName: true, phone: true, city: true, area: true, avatarUrl: true } },
          skills: true,
          portfolio: true,
          serviceAreas: true,
        },
      });
    }

    return res.json({ profile });
  } catch (error: any) {
    console.error('Fetch Provider Profile Error:', error);
    return res.status(500).json({ error: 'Failed to fetch provider profile.' });
  }
};

// 6.1, 6.2, 6.5, 6.6, 6.10: Update Core Profile (Bio, Pricing, Availability, Published status)
export const updateProviderProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      bio,
      experienceYears,
      hourlyRate,
      dailyRate,
      projectRate,
      startingPrice,
      isAvailable,
      languages,
      isPublished, // 6.10 Publish/Unpublish
    } = req.body;

    const updatedProfile = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(dailyRate !== undefined && { dailyRate }),
        ...(projectRate !== undefined && { projectRate }),
        ...(startingPrice !== undefined && { startingPrice }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(languages !== undefined && { languages }),
        ...(isPublished !== undefined && { isPublished }), // Assuming schema supports or handled via availability/status
      },
      include: {
        skills: true,
        portfolio: true,
        serviceAreas: true,
      },
    });

    return res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ error: 'Failed to update provider profile.' });
  }
};

// 6.3 & 6.4: Add/Manage Skills & Services
export const addProviderSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { serviceId, rate } = req.body;
    if (!serviceId) return res.status(400).json({ error: 'Service ID is required.' });

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Provider profile not found.' });

    const providerSkill = await prisma.providerSkill.upsert({
      where: {
        providerId_serviceId: {
          providerId: profile.id,
          serviceId,
        },
      },
      update: { rate },
      create: {
        providerId: profile.id,
        serviceId,
        rate,
      },
      include: { service: true },
    });

    return res.status(201).json({ message: 'Skill added/updated successfully', providerSkill });
  } catch (error: any) {
    console.error('Add Skill Error:', error);
    return res.status(500).json({ error: 'Failed to add skill.' });
  }
};

export const removeProviderSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { skillId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.providerSkill.delete({ where: { id: skillId } });
    return res.json({ message: 'Skill removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove skill.' });
  }
};

// 6.7: Manage Service Areas
export const addServiceArea = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { areaId } = req.body;
    if (!userId || !areaId) return res.status(400).json({ error: 'Area ID is required.' });

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Provider profile not found.' });

    const serviceArea = await prisma.providerServiceArea.create({
      data: {
        providerId: profile.id,
        areaId,
      },
      include: { area: { include: { city: true } } },
    });

    return res.status(201).json({ message: 'Service area added successfully', serviceArea });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add service area.' });
  }
};

export const removeServiceArea = async (req: AuthRequest, res: Response) => {
  try {
    const { areaMappingId } = req.params;
    await prisma.providerServiceArea.delete({ where: { id: areaMappingId } });
    return res.json({ message: 'Service area removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove service area.' });
  }
};

// 6.8: Portfolio Management
export const addPortfolioItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, imageUrl } = req.body;
    if (!userId || !imageUrl || !title) {
      return res.status(400).json({ error: 'Title and image URL are required.' });
    }

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Provider profile not found.' });

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        providerId: profile.id,
        title,
        description,
        imageUrl,
      },
    });

    return res.status(201).json({ message: 'Portfolio item added successfully', portfolioItem });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add portfolio item.' });
  }
};

export const removePortfolioItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    await prisma.portfolioItem.delete({ where: { id: itemId } });
    return res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete portfolio item.' });
  }
};

// 6.9: Provider Dashboard Analytics & Overview
export const getProviderDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        portfolio: true,
        serviceAreas: true,
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { fullName: true, avatarUrl: true } } },
        },
      },
    });

    if (!profile) return res.status(404).json({ error: 'Provider profile not found.' });

    const activeRequestsCount = await prisma.serviceRequest.count({
      where: { providerId: profile.id, status: 'PENDING' },
    });

    const totalRequestsCount = await prisma.serviceRequest.count({
      where: { providerId: profile.id },
    });

    return res.json({
      dashboard: {
        profile,
        metrics: {
          completedJobs: profile.completedJobs,
          ratingAvg: profile.ratingAvg,
          reviewCount: profile.reviewCount,
          activeRequestsCount,
          totalRequestsCount,
          isAvailable: profile.isAvailable,
        },
      },
    });
  } catch (error: any) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ error: 'Failed to load provider dashboard.' });
  }
};