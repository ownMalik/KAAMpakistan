import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const createServiceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { providerId, serviceNeeded, description, scheduledDate, location } = req.body;

    if (!providerId || !serviceNeeded || !location) {
      return res.status(400).json({ error: 'Provider ID, service needed, and location are required.' });
    }

    // Verify provider exists
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
    if (!provider) {
      return res.status(404).json({ error: 'Service provider not found.' });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: customerId!,
        providerId,
        serviceNeeded,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        location,
        status: 'PENDING',
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        provider: { include: { user: { select: { fullName: true, phone: true } } } },
      },
    });

    // Automatically create a conversation thread for this request
    await prisma.conversation.create({
      data: {
        serviceRequestId: serviceRequest.id,
      },
    });

    return res.status(201).json({
      message: 'Service request sent successfully.',
      serviceRequest,
    });
  } catch (error: any) {
    console.error('Create Request Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating service request.' });
  }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let requests;
    if (role === 'PROVIDER') {
      const providerProfile = await prisma.providerProfile.findUnique({ where: { userId } });
      if (!providerProfile) return res.status(404).json({ error: 'Provider profile not found.' });

      requests = await prisma.serviceRequest.findMany({
        where: { providerId: providerProfile.id },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          agreement: true,
          conversation: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      requests = await prisma.serviceRequest.findMany({
        where: { customerId: userId },
        include: {
          provider: { include: { user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } } } },
          agreement: true,
          conversation: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.json({ requests });
  } catch (error: any) {
    console.error('Get Requests Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching requests.' });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // ACCEPTED, DECLINED, COMPLETED, CANCELled

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: 'Service request not found.' });

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return res.json({ message: 'Request status updated', request: updated });
  } catch (error: any) {
    console.error('Update Request Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating request.' });
  }
};

export const createAgreement = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { agreedPrice, agreedDate, duration } = req.body;

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: 'Service request not found.' });

    const agreement = await prisma.agreement.upsert({
      where: { serviceRequestId: requestId },
      update: {
        agreedPrice,
        agreedDate: new Date(agreedDate),
        duration,
      },
      create: {
        serviceRequestId: requestId,
        agreedPrice,
        agreedDate: new Date(agreedDate),
        duration,
      },
    });

    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'AGREED' },
    });

    return res.json({ message: 'Price and terms agreement created', agreement });
  } catch (error: any) {
    console.error('Agreement Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating agreement.' });
  }
};