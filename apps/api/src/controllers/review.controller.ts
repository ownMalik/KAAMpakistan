import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { providerId, rating, comment, quality, punctuality } = req.body;

    if (!providerId || !rating) {
      return res.status(400).json({ error: 'Provider ID and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify provider profile exists
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found.' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        customerId: customerId!,
        providerId,
        rating,
        comment,
        quality,
        punctuality,
      },
    });

    // Recalculate provider average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { providerId },
    });

    const reviewCount = allReviews.length;
    const ratingSum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const ratingAvg = Number((ratingSum / reviewCount).toFixed(1));

    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        ratingAvg,
        reviewCount,
      },
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    return res.status(500).json({ error: 'Internal server error while submitting review.' });
  }
};

export const getProviderReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { providerId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { providerId },
      include: {
        customer: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error('Fetch Reviews Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching reviews.' });
  }
};