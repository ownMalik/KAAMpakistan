import { Response } from 'express';
import prisma from '../config/prisma.ts';
import { AuthRequest } from '../middleware/auth.middleware.ts';

export const getConversationMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ messages });
  } catch (error: any) {
    console.error('Get Messages Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching messages.' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'Conversation ID and content are required.' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: senderId!,
        content,
      },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    return res.status(201).json({ message });
  } catch (error: any) {
    console.error('Send Message Error:', error);
    return res.status(500).json({ error: 'Internal server error while sending message.' });
  }
};