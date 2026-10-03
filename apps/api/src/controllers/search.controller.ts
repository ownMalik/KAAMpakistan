import { Request, Response } from 'express';
import prisma from '../config/prisma.ts';

export const searchProviders = async (req: Request, res: Response) => {
  try {
    const {
      query,          // text search (name, bio, service name)
      categoryId,
      subcategoryId,
      serviceId,
      city,
      area,
      minRating,
      maxPrice,
      minExperience,
      isAvailable,
      sortBy = 'rating', // rating, price_low, experience, newest, reviews
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma where clause
    const whereClause: any = {
      isVerified: true,
    };

    if (city || area || query) {
      whereClause.user = {};
      if (city) {
        whereClause.user.city = { equals: city as string, mode: 'insensitive' };
      }
      if (area) {
        whereClause.user.area = { equals: area as string, mode: 'insensitive' };
      }
    }

    const orConditions: any[] = [];

    if (query) {
      orConditions.push(
        { user: { fullName: { contains: query as string, mode: 'insensitive' } } },
        { bio: { contains: query as string, mode: 'insensitive' } },
        {
          skills: {
            some: {
              service: {
                name: { contains: query as string, mode: 'insensitive' },
              },
            },
          },
        }
      );
    }

    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
    }

    if (serviceId) {
      whereClause.skills = {
        some: { serviceId: serviceId as string },
      };
    } else if (subcategoryId) {
      whereClause.skills = {
        some: {
          service: {
            subcategoryId: subcategoryId as string,
          },
        },
      };
    } else if (categoryId) {
      whereClause.skills = {
        some: {
          service: {
            subcategory: {
              categoryId: categoryId as string,
            },
          },
        },
      };
    }

    if (minRating) {
      whereClause.ratingAvg = { gte: parseFloat(minRating as string) };
    }

    if (minExperience) {
      whereClause.experienceYears = { gte: parseInt(minExperience as string, 10) };
    }

    if (isAvailable === 'true') {
      whereClause.isAvailable = true;
    }

    // Sorting logic
    let orderBy: any = { ratingAvg: 'desc' };
    if (sortBy === 'price_low') {
      orderBy = { startingPrice: 'asc' };
    } else if (sortBy === 'experience') {
      orderBy = { experienceYears: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'reviews') {
      orderBy = { reviewCount: 'desc' };
    }

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
              avatarUrl: true,
              city: true,
              area: true,
            },
          },
          skills: {
            include: {
              service: true,
            },
          },
          serviceAreas: {
            include: {
              area: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.providerProfile.count({ where: whereClause }),
    ]);

    return res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      providers,
    });
  } catch (error: any) {
    console.error('Search Error:', error);
    return res.status(500).json({ error: 'Internal server error during search.' });
  }
};