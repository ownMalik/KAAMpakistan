import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const requestVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      return res.status(400).json({ error: 'Document type and URL are required.' });
    }

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!providerProfile) {
      return res.status(404).json({ error: 'Provider profile not found.' });
    }

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        providerId: providerProfile.id,
        documentType,
        documentUrl,
      },
    });

    return res.status(201).json({ message: 'Verification request submitted successfully.', verificationRequest });
  } catch (error) {
    console.error('Verification Request Error:', error);
    return res.status(500).json({ error: 'Failed to submit verification request.' });
  }
};